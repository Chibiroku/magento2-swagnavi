<?php
namespace SwagNavi\FileOptionGuard\Plugin;

use Magento\Catalog\Api\Data\CustomOptionInterface;
use Magento\Catalog\Model\CustomOptions\CustomOption;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Exception\LocalizedException;

/**
 * Rejects file-type custom option processing unless option_id is genuinely
 * configured as a file-type option in catalog_product_option.
 *
 * Added 2026-06-20: CustomOption::getOptionValue() trusts the client-supplied
 * option_value=='file' flag and processes attached base64 file content via
 * the REST API (POST /V1/guest-carts/{id}/items) with no server-side check
 * that the targeted option_id is actually a file-type option for the
 * product. This was being actively exploited to write arbitrary files into
 * pub/media/custom_options/quote/. This store has zero configured file-type
 * options, so this guard validates against the live catalog_product_option
 * table rather than trusting client input - if a real file-type option is
 * ever added, legitimate use keeps working.
 */
class CustomOptionFileGuard
{
    /**
     * @var ResourceConnection
     */
    private $resourceConnection;

    /**
     * @param ResourceConnection $resourceConnection
     */
    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    /**
     * @param CustomOption $subject
     * @param callable $proceed
     * @return string|array
     * @throws LocalizedException
     */
    public function aroundGetOptionValue(CustomOption $subject, callable $proceed)
    {
        $rawValue = $subject->getData(CustomOptionInterface::OPTION_VALUE);
        if ($rawValue === 'file') {
            $optionId = $subject->getOptionId();
            $connection = $this->resourceConnection->getConnection();
            $table = $this->resourceConnection->getTableName('catalog_product_option');
            $type = $connection->fetchOne(
                $connection->select()->from($table, 'type')->where('option_id = ?', $optionId)
            );
            if (strpos((string)$type, 'file') !== 0) {
                throw new LocalizedException(__('Invalid custom option submission.'));
            }
        }
        return $proceed();
    }
}
