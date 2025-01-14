"use strict";

(async () => {
    document.addEventListener("DOMContentLoaded", () => {
        const toggleSections = (sectionToShow) => {
            // הסתרת כל הסקשנים
            const sections = document.querySelectorAll("main section");
            sections.forEach((section) => section.classList.add("d-none"));

            // הצגת הסקשן המבוקש
            const section = document.getElementById(sectionToShow);
            if (section) {
                section.classList.remove("d-none");

                // רינדור המטבעות רק אם אנחנו בעמוד COINS
                if (sectionToShow === "coins") {
                    renderCoins();
                }
            }
        };

        // מאזינים ללחיצות על כפתורי הניווט
        document.getElementById("navCoins").addEventListener("click", () => {
            toggleSections("coins");
        });

        document.getElementById("navReports").addEventListener("click", () => {
            toggleSections("reports");
        });

        document.getElementById("navAbout").addEventListener("click", () => {
            toggleSections("about");
        });

        // ברירת מחדל: הצגת עמוד ה-COINS בעת טעינה
        toggleSections("coins");
    });

    const getData = async (url) => fetch(url).then((response) => response.json());

    // רינדור המטבעות
    const renderCoins = async () => {
        try {
            let coins = await getData("https://api.coingecko.com/api/v3/coins/list");
            coins = coins.slice(0, 100); // מגבילים ל-100 מטבעות

            const html = coins
                .map(
                    (coin) => `
                <div class="card" style="width: 18rem;">
                    <div class="card-body">
                        <h5 class="card-title">${coin.name}</h5>
                        <p class="card-text">ID: ${coin.id}</p>
                        <p class="card-text">Symbol: ${coin.symbol}</p>
                        <button class="btn btn-primary more-info-btn" data-coin="${coin.id}">More Info</button>
                    </div>
                </div>`
                )
                .join("");

            document.getElementById("cards-container").innerHTML = html;

            // מאזינים ללחיצות על כפתורי "More Info"
            document.querySelectorAll(".more-info-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const coinId = event.target.dataset.coin;
                    const coinData = await getData(`https://api.coingecko.com/api/v3/coins/${coinId}`);
                    showCoinInfo(coinData);
                });
            });
        } catch (error) {
            console.error("Error fetching or rendering coins:", error);
        }
    };

    // פונקציה להצגת מידע נוסף על מטבע בחלונית
    const showCoinInfo = (coin) => {
        const modalHtml = `
            <div class="modal fade" id="coinModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${coin.name} (${coin.symbol.toUpperCase()})</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Market Cap Rank: ${coin.market_cap_rank}</p>
                            <p>Current Price (USD): $${coin.market_data?.current_price?.usd || "N/A"}</p>
                            <p>Description: ${coin.description?.en || "No description available"}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        const modal = new bootstrap.Modal(document.getElementById("coinModal"));
        modal.show();

        // ניקוי החלונית מה-HTML אחרי סגירה
        document.getElementById("coinModal").addEventListener("hidden.bs.modal", () => {
            document.getElementById("coinModal").remove();
        });
    };
})();
