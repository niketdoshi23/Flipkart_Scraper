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

    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    console.log("Navigating to:", productUrl);

    // Navigate and wait for critical selectors
    await page.goto(productUrl);

    // Wait for key elements with longer timeout
    try {
      await Promise.race([
        page.waitForSelector("div._30jeq3", { timeout: 10000 }),
        page.waitForSelector("div._16Jk6d", { timeout: 10000 }),
        page.waitForSelector('div[class*="_30jeq3"]', { timeout: 10000 }),
      ]);
    } catch (error) {
      console.log("Warning: Some elements didn't load in time");
    }

    // Additional wait for dynamic content
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

    // Improved scrolling with multiple passes
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const scrollStep = () => {
          window.scrollTo(0, 0);
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
            setTimeout(() => {
              window.scrollTo(0, 0);
              setTimeout(resolve, 500);
            }, 500);
          }, 500);
        };
        scrollStep();
      });
    });

    await page.waitForTimeout(2000);

    // Extract product details with enhanced selectors and parsing
    const productData = await page.evaluate(() => {
      const getTextContent = (selectors) => {
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const text = element.textContent.trim();
              if (text) return text;
            }
          } catch (e) {
            console.error(`Error with selector ${selector}:`, e);
          }
        }
        return null;
      };

      const findPrice = () => {
        // Try multiple methods to find price
        const methods = [
          // Method 1: Direct class selectors
          () => {
            const priceSelectors = [
              "div._30jeq3._16Jk6d",
              "div._16Jk6d",
              "div._30jeq3",
              "div[class*='_30jeq3']",
              "div[class*='_16Jk6d']",
              "div._3qQ9m1",
              "div.CEmiEU",
              "div[class*='price']",
              "div._3I9_wc._2p6lqe",
            ];

            for (const selector of priceSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const text = element.textContent.trim();
                const priceMatch = text.match(/₹[,\d]+|[,\d]+/);
                if (priceMatch) {
                  return parseFloat(priceMatch[0].replace(/[₹,]/g, ""));
                }
              }
            }
            return 0;
          },

          // Method 2: Search all elements with price-like classes
          () => {
            const priceElements = document.querySelectorAll(
              '[class*="price"], [class*="30jeq3"], [class*="16Jk6d"]'
            );
            for (const element of priceElements) {
              const text = element.textContent.trim();
              const priceMatch = text.match(/₹[,\d]+|[,\d]+/);
              if (priceMatch) {
                return parseFloat(priceMatch[0].replace(/[₹,]/g, ""));
              }
            }
            return 0;
          },

          // Method 3: Search all elements for price pattern
          () => {
            const allElements = document.querySelectorAll("*");
            for (const element of allElements) {
              const text = element.textContent.trim();
              if (text.includes("₹") && text.length < 15) {
                const priceMatch = text.match(/₹[,\d]+|[,\d]+/);
                if (priceMatch) {
                  return parseFloat(priceMatch[0].replace(/[₹,]/g, ""));
                }
              }
            }
            return 0;
          },
        ];

        for (const method of methods) {
          const price = method();
          if (price > 0) return price;
        }
        return 0;
      };

      const findReviews = () => {
        const reviewSelectors = [
          "span._2_R_DZ",               // Primary review element
          "span[class*='_2_R_DZ']",      // Class pattern that includes reviews
          "div._3I9_wc._2p6lqe",         // Alternative review element
          "span._13vcmD",                // Another common review class
        ];
      
        // Pattern to extract reviews count from text
        const reviewPattern = /(\d[\d,]*)\s*Reviews?/i;
      
        const parseReviewNumber = (text) => {
          const match = text.match(reviewPattern);
          if (match) {
            // Remove commas and return the number
            return parseInt(match[1].replace(/,/g, ""), 10);
          }
          return 0;
        };
      
        // Loop through the selectors and try to extract the review count
        for (const selector of reviewSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent.trim();
            const reviewCount = parseReviewNumber(text);
            if (reviewCount > 0) {
              return reviewCount;
            }
          }
        }
      
        // If no reviews found, return 0
        return 0;
      };
      
      
      const findRating = () => {
        // Rating selectors in order of reliability
        const ratingSelectors = [
          {
            selector: "div._3LWZlK",
            validation: (text) =>
              parseFloat(text) >= 0 && parseFloat(text) <= 5,
          },
          {
            selector: "div[class*='gUuXy-']",
            validation: (text) =>
              text.includes("★") ||
              (parseFloat(text) >= 0 && parseFloat(text) <= 5),
          },
          {
            selector: "div._2d4LTz",
            validation: (text) =>
              parseFloat(text) >= 0 && parseFloat(text) <= 5,
          },
          {
            selector: "div[class*='rating']",
            validation: (text) =>
              parseFloat(text) >= 0 && parseFloat(text) <= 5,
          },
        ];

        // Helper to clean and parse rating text
        const parseRating = (text) => {
          // Remove stars and other non-numeric characters except decimal point
          const cleaned = text.replace(/[^\d.]/g, "");
          const rating = parseFloat(cleaned);

          // Validate the rating is within reasonable bounds
          if (!isNaN(rating) && rating >= 0 && rating <= 5) {
            // Round to one decimal place
            return Math.round(rating * 10) / 10;
          }
          return null;
        };

        // Try each selector
        for (const { selector, validation } of ratingSelectors) {
          const elements = document.querySelectorAll(selector);

          for (const element of elements) {
            const text = element.textContent.trim();

            // Skip empty or clearly invalid content
            if (!text || text.length > 10) continue;

            // Validate the text matches expected format
            if (validation(text)) {
              const rating = parseRating(text);
              if (rating !== null) {
                return rating;
              }
            }
          }
        }

        // Fallback: look for any element with a star rating pattern
        const starPattern = /([0-5](?:\.\d)?)\s*★/;
        const allElements = document.querySelectorAll("*");

        for (const element of allElements) {
          const text = element.textContent.trim();
          const match = text.match(starPattern);

          if (match) {
            const rating = parseFloat(match[1]);
            if (!isNaN(rating) && rating >= 0 && rating <= 5) {
              return rating;
            }
          }
        }

        return 0;
      };

      const findImage = () => {
        const imageSelectors = [
          "img._396cs4",
          "img._2r_T1I",
          "div._1AtVbE img",
          "div.CXW8mj img",
          "div._3kidJX img",
          "img[class*='_396cs4']",
          "img[class*='product-image']",
          // New broader selectors
          "div[class*='image'] img",
          "div[class*='picture'] img",
          "div[class*='photo'] img",
          // Try all images and filter
          "img[src*='rukminim']",
          "img[src*='flixcart']",
        ];

        for (const selector of imageSelectors) {
          const images = document.querySelectorAll(selector);
          for (const img of images) {
            if (
              img.src &&
              !img.src.includes("data:image") &&
              (img.src.includes("rukminim") || img.src.includes("flixcart"))
            ) {
              return img.src;
            }
          }
        }

        // Fallback: look for any product-like image
        const allImages = document.querySelectorAll("img");
        for (const img of allImages) {
          if (
            img.src &&
            !img.src.includes("data:image") &&
            img.width > 100 &&
            img.height > 100
          ) {
            return img.src;
          }
        }

        return null;
      };

      const title = getTextContent([
        "span.B_NuCI",
        "h1.yhB1nd",
        "div._35KyD6",
        'h1[class*="title"]',
        "h1",
        'div[class*="title"]',
      ]);

      const price = findPrice();
      //   const rating = parseFloat(getTextContent([
      //     "div._3LWZlK",
      //     'div[class*="_3LWZlK"]',
      //     'div[class*="rating"]',
      //     'span[class*="rating"]',
      //     'div._2d4LTz',
      //   ])) || 0;

      const reviews = findReviews();
      const imageUrl = findImage();
      const rating = findRating();
      const debugData = {
        titleText: title,
        priceFound: price > 0,
        price,
        ratingValue: rating,
        reviews,
        imageFound: !!imageUrl,
        imageUrl,
        rawHtml: document.documentElement.innerHTML.slice(0, 1000), // First 1000 chars for debugging
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
