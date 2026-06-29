<?php
/**
 * Serializes writes to Magento_Csp's SubresourceIntegrityRepository.
 *
 * SubresourceIntegrityRepository::save()/saveBunch() do a read-modify-write:
 * load existing hashes from a shared file (one file per area, e.g. all
 * frontend stores/themes share "frontend"), merge in the new entry, then
 * write the whole map back. With no locking, concurrent requests -- typical
 * right after a deploy/upgrade resets the merged-asset cache -- can each
 * load the same stale data and overwrite each other's update (lost writes),
 * or interleave their writes into invalid JSON (the crash this module
 * fixes). Locking only the underlying file load()/save() calls individually
 * is not enough, since the race is across the whole load+merge+write
 * sequence -- so the lock must wrap the entire repository method call.
 */
declare(strict_types=1);

namespace SwagNavi\CspSriFix\Plugin;

use Magento\Csp\Model\SubresourceIntegrity;
use Magento\Csp\Model\SubresourceIntegrityRepository;
use Magento\Framework\Lock\LockManagerInterface;
use Psr\Log\LoggerInterface;

class LockSriRepositoryWrites
{
    private const LOCK_NAME = 'swagnavi_csp_sri_repo_write';
    private const LOCK_TIMEOUT = 10;

    public function __construct(
        private readonly LockManagerInterface $lockManager,
        private readonly LoggerInterface $logger
    ) {
    }

    public function aroundSave(SubresourceIntegrityRepository $subject, callable $proceed, SubresourceIntegrity $integrity): bool
    {
        return (bool) $this->withLock(static fn () => $proceed($integrity));
    }

    public function aroundSaveBunch(SubresourceIntegrityRepository $subject, callable $proceed, array $bunch): bool
    {
        return (bool) $this->withLock(static fn () => $proceed($bunch));
    }

    public function aroundDeleteAll(SubresourceIntegrityRepository $subject, callable $proceed): bool
    {
        return (bool) $this->withLock(static fn () => $proceed());
    }

    private function withLock(callable $callback): mixed
    {
        if (!$this->lockManager->lock(self::LOCK_NAME, self::LOCK_TIMEOUT)) {
            $this->logger->warning(
                'SwagNavi_CspSriFix: could not acquire lock "' . self::LOCK_NAME . '" within '
                . self::LOCK_TIMEOUT . 's, proceeding without lock.'
            );

            return $callback();
        }

        try {
            return $callback();
        } finally {
            $this->lockManager->unlock(self::LOCK_NAME);
        }
    }
}
