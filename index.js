const fs = require("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const axios = require("axios").default;

//const URL = 'https://www.ebay.com/itm/For-2005-2010-Honda-Odyssey-Window-Motor-Rear-Left-Dorman-53719ZP-2008-2006-2007/392587184803?fits=Year%3A2006%7CModel%3AOdyssey&hash=item5b68050aa3:g:QEkAAOSw9tFd9G1I:sc:FedExHomeDelivery!75040!US!-1';
// const URL = 'https://www.amazon.com/dp/B07RPS6CGP/ref=dp_cerb_2';
//const URL = 'https://www.walmart.com/ip/EVOO-11-6-Ultra-Thin-Laptop-FHD-Intel-Dual-Core-32GB-Storage-4GB-Memory-Mini-HDMI-Front-Camera-Windows-10-Home-Black-Includes-Office-365-Personal-One/189712068';


exports.handler = async (event, context, callback) => {
    console.log(event);
    let url = event.url;
    console.log("processing with url:", url);
    await process(url, context, callback);

}

const getPrice = (dom, selector) => {
    let price;
    dom.window.document.querySelectorAll(selector).forEach(p => {
        console.log(p.textContent);
        if(p.textContent) {
            console.log("found price:", p.textContent);
            price = p.textContent;
        }
        
    });

    return price;
}

const process = async (url, context, callback) => {
    console.log("in process with url:", url);
    let response = {};
    
    try {

        const options = {
            headers: {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36'}
          };

        const result = await axios.get(url, {}, options);
        console.log("url: ", url);
        
        console.log("response:", result.data.substring(1, 100));
        console.log("Url to use:", url);
        console.log("creating parser");
        const dom = new JSDOM(result.data);

        console.log("parser created.....");
        let title = dom.window.document.querySelector('title').textContent;
        console.log(title);

        response.title = title;

        let imageArr = [];

        dom.window.document.querySelectorAll('img').forEach(img => {
            console.log(img.alt);
            if (img.alt && img.src 
                    && img.src.indexOf(".svg") === -1 
                    && img.src.indexOf(".gif") === -1
                    && img.src.indexOf(".png") === -1
                    && img.src.indexOf("base64") === -1
                    && img.src.indexOf("thumb") === -1) {
                imageArr.push(img.src);
            }
        });

        response.images = imageArr;


        if (url.indexOf('www.ebay.com') >= 0) {
            let price = getPrice(dom, '#prcIsum');
            response.price = price;
        }
        else if (url.indexOf('www.amazon.com') >= 0) {
            let price = getPrice(dom, '#priceblock_ourprice');
            response.price = price;
        } else if (url.indexOf('www.walmart.com') >= 0) {
            let price = getPrice(dom, '.prod-PriceSection .price-characteristic');
            response.price = price;
        } 

        console.log(response);

        if (context) {
            context.succeed({statusCode: 200, body: JSON.stringify(response)});
        }
    } catch (error) {
        if (callback) {
            callback(error);
        }

        console.log(error);
    }
}

//process(URL);
