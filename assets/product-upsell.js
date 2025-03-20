function handleLocalStorage() {
     //Set the current product inside the localStorage
     console.log('handling')

     let lastViewedProducts = JSON.parse(localStorage.getItem('lastViewedProducts'));
     if (!lastViewedProducts) {
       lastViewedProducts = [window.currentProduct];

       localStorage.setItem('lastViewedProducts', JSON.stringify(lastViewedProducts));
     } else {
       //Remove the current product from the array so there are no duplicates
       lastViewedProducts = lastViewedProducts.filter(product => product.id !== window.currentProduct.id);

       //Add the current product to the beginning of the array
       lastViewedProducts.unshift(window.currentProduct);

       //Keep the array to a maximum of 3 products
       if (lastViewedProducts.length > 3)  lastViewedProducts.pop();

       localStorage.setItem('lastViewedProducts', JSON.stringify(lastViewedProducts));

     }
}

//Main function

function initUpsell() {

    const lastProducts = JSON.parse(localStorage.getItem('lastViewedProducts'));
    
    //With no recently viewed products, or the only one being the same product we are seeing already, nothing renders
    if (!lastProducts || (lastProducts.length == 1  && lastProducts[0].id == window.currentProduct.id)) {
        handleLocalStorage(); 
        return;
    }

    renderUpsell(lastProducts);

    handleLocalStorage();
}

function renderUpsell(products) {
    const upsellContainer = document.querySelector('.custom-upsell-container');

    let productCards = '<h4>We know you also want this!</h4>'; // We add the title first. Can be done in other ways but we want speed

    products.forEach(product => {

        if (product.id === window.currentProduct.id) return; //We don't want to show the current product in the upsell section

        //We will be adding the additional HTML for the product cards on this loop
        productCards += `
            <div class="upsell-card">
                <img src="${product.featured_image}" alt="${product.title}" />
                <h5>${product.title}</h5>
                <p>${window.currencySymbol} ${(parseFloat(product.price) / 100).toFixed(2)} ${window.Shopify.currency.active}</p>

                <button type="button" class="add-to-cart" data-variant-id="${product.viewedVariant.id}" onclick="upsellATC(this)">Add to cart</button>
            </div>
        `;
    });

    upsellContainer.innerHTML = productCards;

}

//With the element we can get the variant id and add it to the cart

async function upsellATC(element) {
    let formData = {
        'items': [{
         'id': element.dataset.variantId,
         'quantity': 1
         }]
       };

       try {
           let response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json'
             },
             body: JSON.stringify(formData)
           });
    
           let data = await response.json();

           updateCart();

       } catch (error) {
        alert(error);
       }
       
}

async function updateCart() {
    try {
        let response = await fetch(`${routes.cart_url}?section_id=cart-drawer`);
        let responseText = await response.text();

        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const targetElement = document.querySelector('cart-drawer');
        const sourceElement = html.querySelector('cart-drawer');
        targetElement.replaceWith(sourceElement);
        
        //We update the cart icon bubble

        //fetch the product count
        let cartResponse = await fetch(window.Shopify.routes.root + 'cart.js');
        let cartData = await cartResponse.json();

        let itemCount = cartData.item_count;

        const cartIconHeader = document.querySelector('.header__icon.header__icon--cart');
        let bubble = cartIconHeader.querySelector('.cart-count-bubble');
        if (bubble) bubble.remove();
        const bubbleHTML = `
            <div class="cart-count-bubble"><span aria-hidden="true">${itemCount}</span>
            </div>
        `;
        cartIconHeader.innerHTML += bubbleHTML;

        //We open the drawer

        const cartDrawer = document.querySelector('cart-drawer');
        cartDrawer.classList.add('active');

    } catch (error) {
        alert("There was an error updating the cart: " + error);
    }
}

initUpsell();

