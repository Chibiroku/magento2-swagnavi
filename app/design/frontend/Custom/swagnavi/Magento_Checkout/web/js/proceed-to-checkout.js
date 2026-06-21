/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
    'jquery',
    'Magento_Customer/js/model/authentication-popup',
    'Magento_Customer/js/customer-data'
], function ($, authenticationPopup, customerData) {
    'use strict';

    return function (config, element) {
        $(element).click(function (event) {
            var cart = customerData.get('cart'),
                customer = customerData.get('customer');

            event.preventDefault();

            if (!customer().firstname && cart().isGuestCheckoutAllowed === false) {
                authenticationPopup.showModal();

                return false;
            }
            $(element).attr('disabled', true);
            $('.modals-wrapper').prepend(`
                <style>
                    .modal-popup .modal-inner-wrap {
                        position: fixed !important;
                    }
                </style>`);
            // location.href = config.checkoutUrl;
            // event.preventDefault();
            require(["Magento_Ui/js/modal/alert"], function (alert) {
                alert({
                    title: "Attention",
                    content: "Are you sure you want to check out? Items are not refundable even for size changes.",
                    modalClass: "alert",
                    actions: {
                        always: function () {
                            // Do something when the modal is closed
                            // this.closeModal(true);
                            $(element).attr('disabled', false);
                        },
                    },
                    buttons: [
                        {
                            text: $.mage.__("OK, Proceed to check out."),
                            class: "action primary accept",
                            click: function () {
                                window.location.href = config.checkoutUrl;
                                this.closeModal(true);
                                $(element).attr('disabled', false);
                            },
                        },
                        {
                            text: $.mage.__("No, I need to confirm the measurements."),
                            class: "action",
                            click: function () {
                                // Close the modal
                                this.closeModal(true);
                                // Re-enable the Proceed to Checkout button
                                $(element).attr('disabled', false);
                            },
                        },
                    ],
                });
            });
        });

    };
});

