define([
  "uiComponent",
  "Magento_Customer/js/customer-data",
  "jquery",
  "ko",
  "underscore",
  "sidebar",
  "mage/translate",
  "mage/dropdown",
], function (Component, customerData, $, ko, _) {
  "use strict";

  var sidebarInitialized = false,
    addToCartCalls = 0,
    miniCart;

  miniCart = $("[data-block='minicart']");

  function initSidebar() {
    if (miniCart.data("mageSidebar")) {
      miniCart.sidebar("update");
    }

    if (!$("[data-role=product-item]").length) {
      return false;
    }
    miniCart.trigger("contentUpdated");

    if (sidebarInitialized) {
      return false;
    }
    sidebarInitialized = true;
    miniCart.sidebar({
      targetElement: "div.block.block-minicart",
      url: {
       // window.checkout.checkoutUrl
       checkout : '#' ,
        checkout1: window.checkout.checkoutUrl,
        update: window.checkout.updateItemQtyUrl,
        remove: window.checkout.removeItemUrl,
        loginUrl: window.checkout.customerLoginUrl,
        isRedirectRequired: window.checkout.isRedirectRequired,
      },
      button: {
        checkout: "#top-cart-btn-checkout",
        remove: "#mini-cart a.action.delete",
        close: "#btn-minicart-close",
      },
      showcart: {
        parent: "span.counter",
        qty: "span.counter-number",
        label: "span.counter-label",
      },
      minicart: {
        list: "#mini-cart",
        content: "#minicart-content-wrapper",
        qty: "div.items-total",
        subtotal: "div.subtotal span.price",
        maxItemsVisible: window.checkout.minicartMaxItemsVisible,
      },
      item: {
        qty: ":input.cart-item-qty",
        button: ":button.update-cart-item",
      },
      confirmMessage: $.mage.__(
        "Are you sure you would like to remove this item from the shopping cart?"
      ),
    });
  }

  function openAlertModal() {
   // event.preventDefault();
    require(["Magento_Ui/js/modal/alert"], function (alert) {
      alert({
        title: "Alert Title",
        content: "This is my popup content",
        modalClass: "alert",
        actions: {
          always: function () {
            // Do something when the modal is closed
          },
        },
        buttons: [
          {
            text: $.mage.__("OK"),
            class: "action primary accept",
            click: function () {
              window.location.href = window.checkout.checkoutUrl;
              this.closeModal(true);
            },
          },
          {
            text: $.mage.__("Cancel"),
            class: "action",
            click: function () {
               // Close the modal
            this.closeModal(true);
            // Re-enable the Proceed to Checkout button
            $('#top-cart-btn-checkout').prop('disabled', false);
              
            },
          },
        ],
      });
    });
  }

  miniCart.on("dropdowndialogopen", function () {
    initSidebar();
  });

  return Component.extend({
    shoppingCartUrl: window.checkout.shoppingCartUrl,
    maxItemsToDisplay: window.checkout.maxItemsToDisplay,
    cart: {},

    initialize: function () {
      var self = this,
        cartData = customerData.get("cart");

      this.update(cartData());
      cartData.subscribe(function (updatedCart) {
        addToCartCalls--;
        this.isLoading(addToCartCalls > 0);
        sidebarInitialized = false;
        this.update(updatedCart);
        initSidebar();
      }, this);

      $('[data-block="minicart"]').on("contentLoading", function () {
        addToCartCalls++;
        self.isLoading(true);
      });

      if (
        (cartData().website_id !== window.checkout.websiteId &&
          cartData().website_id !== undefined) ||
        (cartData().storeId !== window.checkout.storeId &&
          cartData().storeId !== undefined)
      ) {
        customerData.reload(["cart"], false);
      }

      // Attach event listener to the checkout button to capture click event
      $('#top-cart-btn-checkout').on('click', function (event) {
        self.closeMinicart(event);
       //openAlertModal();
      });

      return this._super();
    },

    isLoading: ko.observable(false),
    initSidebar: initSidebar,
   
 
    closeMinicart: function (event) {
      // Prevent default behavior (e.g., form submit or redirect)
     if (event && event.preventDefault) {
        event.preventDefault(); // Prevent the default action (e.g., following a link)
    }

      // Check the element that triggered the action
      var triggeredByCheckout = document.activeElement.id === "top-cart-btn-checkout";

      if (triggeredByCheckout) {
       
        openAlertModal();
        $(".alert, .modal-popup._show").css({
          position: "absolute !important",
        });
        $(" .modal-popup .modal-inner-wrap").css({
          position: "fixed !important",
        });
      } else {
        $('[data-block="minicart"]')
          .find('[data-role="dropdownDialog"]')
          .dropdownDialog("close");
      }
    },

    getItemRenderer: function (productType) {
      return this.itemRenderer[productType] || "defaultRenderer";
    },

    update: function (updatedCart) {
      _.each(
        updatedCart,
        function (value, key) {
          if (!this.cart.hasOwnProperty(key)) {
            this.cart[key] = ko.observable();
          }
          this.cart[key](value);
        },
        this
      );
    },

    getCartParamUnsanitizedHtml: function (name) {
      if (!_.isUndefined(name)) {
        if (!this.cart.hasOwnProperty(name)) {
          this.cart[name] = ko.observable();
        }
      }

      return this.cart[name]();
    },

    getCartParam: function (name) {
      return this.getCartParamUnsanitizedHtml(name);
    },

    getCartItems: function () {
      var items = this.getCartParamUnsanitizedHtml("items") || [];

      items = items.slice(parseInt(-this.maxItemsToDisplay, 10));

      return items;
    },

    getCartLineItemsCount: function () {
      var items = this.getCartParamUnsanitizedHtml("items") || [];

      return parseInt(items.length, 10);
    },
  });
});
