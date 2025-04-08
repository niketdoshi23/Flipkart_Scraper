const { chromium } = require("playwright");

const isValidFlipkartUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "www.flipkart.com" && url.includes("/p/");
  } catch {
    return false;
  }
};

const fetchProductDetails = async (productUrl) => {
  if (!isValidFlipkartUrl(productUrl)) {
    throw new Error("Invalid Flipkart URL");
  }

  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Set extended timeout for navigation
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    console.log("Navigating to:", productUrl);

    // Navigate with extended timeout
    await page.goto(productUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for key content with a more reliable strategy
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // Wait for dynamic content

    // Scroll multiple times to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }

    // Extract product details with multiple strategies
    const productData = await page.evaluate(() => {
      // Helper function to try multiple selectors
      const getTextContent = (selectors) => {
        for (const selector of selectors) {
          try {
            const element = document.querySelector(selector);
            if (element) {
              const text = element.textContent.trim();
              if (text) return text;
            }
          } catch (e) {
            console.error(`Error with selector ${selector}:`, e);
          }
        }
        return null;
      };

      // Try to find price with multiple strategies
      const findPrice = () => {
        const priceSelectors = [
          "div._30jeq3._16Jk6d",
          'div[class*="_30jeq3"]',
          'div[class*="_16Jk6d"]',
          '*[class*="price"]._30jeq3',
          '*[class*="price"]',
          "div._30jeq3",
          "div._16Jk6d",
        ];

        const priceText = getTextContent(priceSelectors);
        if (priceText) {
          const priceMatch = priceText.match(/₹?([0-9,]+)/);
          if (priceMatch) {
            return parseFloat(priceMatch[1].replace(/,/g, ""));
          }
        }

        // Alternative strategy: look for any element containing a price-like pattern
        const pricePattern = /₹[0-9,]+/;
        const elements = document.querySelectorAll("*");
        for (const element of elements) {
          if (element.textContent.match(pricePattern)) {
            const match = element.textContent.match(/₹([0-9,]+)/);
            if (match) {
              return parseFloat(match[1].replace(/,/g, ""));
            }
          }
        }

        return 0;
      };

      // Get title with multiple strategies
      const titleSelectors = [
        "span.B_NuCI",
        "h1.yhB1nd",
        "div._35KyD6",
        'h1[class*="title"]',
        "h1",
      ];

      // Get rating and reviews with multiple strategies
      const ratingSelectors = [
        "div._3LWZlK",
        'div[class*="rating"]',
        '*[class*="rating"]',
      ];

      const reviewsSelectors = [
        "span._2_R_DZ",
        '*[class*="review-count"]',
        'span[class*="reviews"]',
      ];

      // Get image with multiple strategies
      const imageSelectors = [
        "img._396cs4",
        "img._2r_T1I",
        "div._1AtVbE img",
        '*[class*="product-image"] img',
        'div[class*="CXW8mj"] img',
      ];

      const title = getTextContent(titleSelectors);
      const price = findPrice();
      const ratingText = getTextContent(ratingSelectors);
      const reviewsText = getTextContent(reviewsSelectors);

      // Find image URL
      let imageUrl = null;
      for (const selector of imageSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src) {
          imageUrl = img.src;
          break;
        }
      }

      // Parse rating and reviews
      let rating = 0;
      if (ratingText) {
        const ratingMatch = ratingText.match(/[\d.]+/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[0]);
        }
      }

      let reviews = 0;
      if (reviewsText) {
        const reviewsMatch = reviewsText.match(/[\d,]+/);
        if (reviewsMatch) {
          reviews = parseInt(reviewsMatch[0].replace(/,/g, ""));
        }
      }

      // Debug data
      const debugData = {
        titleText: title,
        priceFound: price > 0,
        price,
        ratingText,
        reviewsText,
        imageUrl,
      };
      console.log("Debug data:", debugData);

      return {
        title,
        price,
        rating,
        reviews,
        image: imageUrl,
        debugData,
      };
    });

    console.log("Extracted product data:", productData);

    if (!productData.title) {
      throw new Error("Failed to extract product title");
    }

    return {
      ...productData,
      url: productUrl,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Scraping error details:", {
      message: error.message,
      stack: error.stack,
      url: productUrl,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch(console.error);
    }
  }
};

module.exports = { fetchProductDetails };
