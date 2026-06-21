<?php

namespace SwagNavi\EmailThumbnail\Block\Email\Items\Order;

use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Catalog\Model\ProductRepository;
use Magento\Sales\Block\Order\Email\Items\Order\DefaultOrder as MagentoDefaultOrder;

class DefaultOrder extends MagentoDefaultOrder
{
    protected $imageHelper;
    protected $productRepository;

    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        ImageHelper $imageHelper,
        ProductRepository $productRepository,
        array $data = []
    ) {
        $this->imageHelper = $imageHelper;
        $this->productRepository = $productRepository;
        parent::__construct($context, $data);
    }

    public function getProductThumbnailUrl()
    {
        $item = $this->getItem();

        if (!$item) {
            return '';
        }

        $sku = $item->getSku();
        if (!$sku) {
            return '';
        }

        try {
            $product = $this->productRepository->get($sku);
        } catch (\Exception $e) {
            return '';
        }

        return $this->imageHelper->init($product, 'product_thumbnail_image')->getUrl();
    }
}

