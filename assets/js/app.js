"use strict";

(async () => {
    document.addEventListener("DOMContentLoaded", () => {
        const toggleSections = (sectionToShow) => {
            const sections = document.querySelectorAll("main section");
            sections.forEach((section) => section.classList.add("d-none"));

            const section = document.getElementById(sectionToShow);
            if (section) {
                section.classList.remove("d-none");

                if (sectionToShow === "coins") {
                    renderCoins();
                }
            }
        };

        document.getElementById("navCoins").addEventListener("click", () => {
            toggleSections("coins");
        });

        document.getElementById("navReports").addEventListener("click", () => {
            toggleSections("reports");
        });

        document.getElementById("navAbout").addEventListener("click", () => {
            toggleSections("about");
        });

        toggleSections("coins");
    });

    const getData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };

    const renderCoins = async () => {
        try {
            let coins = await getData("https://api.coingecko.com/api/v3/coins/list");
            coins = coins.slice(0, 100);

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
                            <label for="coinChoose">
            <input type="checkbox" class="coin-checkbox" id="chooseCoin">
        
        </label>
                </div>`
                )
                .join("");

            document.getElementById("cards-container").innerHTML = html;

            document.querySelectorAll(".more-info-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const coinId = event.target.dataset.coin;
                    const coinData = await getData(`https://api.coingecko.com/api/v3/coins/${coinId}`);
                    showCoinInfo(coinData);
                });
            });



            // טפל בבחירת מטבעות כאן
            document.querySelectorAll('.coin-checkbox').forEach(function(checkbox) {
                checkbox.addEventListener('change', function() {
                    // סופר את כמות המטבעות המסומנים
                    let selectedCoins = document.querySelectorAll('.coin-checkbox:checked').length;

                    // אם נבחרו יותר מ-5 מטבעות, מבטלים את הסימון הנוכחי ומציגים את ההתראה
                    if (selectedCoins > 5) {
                        checkbox.checked = false; // מבטל את הסימון האחרון
                        alert("You can select up to 5 coins only. if you want you can change it.");
                    } else {
                        // מציג את המידע בקונסול
                        if (checkbox.checked) {
                            console.log('Coin selected: ' + checkbox.id);
                        } else {
                            console.log('Coin unselected: ' + checkbox.id);
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Error fetching or rendering coins:", error);
        }
    };

            
;

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
                            <img src="${coin.image?.large || ''}" alt="${coin.name}" class="img-fluid mb-3">
                            <p>Current Price:</p>
                            <ul>
                                <li>USD: ${coin.market_data?.current_price?.usd ? `$${coin.market_data.current_price.usd}` : 'N/A'}</li>
                                <li>EUR: ${coin.market_data?.current_price?.eur ? `€${coin.market_data.current_price.eur}` : 'N/A'}</li>
                                <li>ILS: ${coin.market_data?.current_price?.ils ? `₪${coin.market_data.current_price.ils}` : 'N/A'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHtml);
        const modal = new bootstrap.Modal(document.getElementById("coinModal"));
        modal.show();

        document.getElementById("coinModal").addEventListener("hidden.bs.modal", () => {
            document.getElementById("coinModal").remove();
        });
    };
})();


let selectedCoins = [];

function getPrices() {
    if (selectedCoins.length === 0) return;

    const symbols = selectedCoins.join(','); // ליצור רשימה של מטבעות נבחרים
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let chartData = [];
            const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#FFFF33']; // צבעים עבור כל מטבע

            let index = 0;
            for (const coin in data) {
                if (data.hasOwnProperty(coin)) {
                    chartData.push({
                        type: "line", // שים לב לשינוי כאן - סוג הגרף הוא "line"
                        name: coin,
                        showInLegend: true,
                        dataPoints: [{ label: new Date().toLocaleTimeString(), y: data[coin].USD }],
                        color: colors[index] // הגדרת הצבע לפי סדר
                    });
                    index++;
                }
            }

            // הגדרת הגרף
            const chart = new CanvasJS.Chart("chartContainer", {
                title: {
                    text: "Real-time Cryptocurrency Prices"
                },
                axisX: {
                    title: "Time",
                    interval: 1,
                    labelAngle: -45 // הצגת תוויות הציר X בצורה קריאה
                },
                axisY: {
                    title: "Price (USD)"
                },
                legend: {
                    cursor: "pointer",
                    itemclick: function(e) {
                        if (e.dataSeries.visible === undefined || e.dataSeries.visible) {
                            e.dataSeries.visible = false;
                        } else {
                            e.dataSeries.visible = true;
                        }
                        chart.render();
                    }
                },
                data: chartData
            });

            chart.render();
        })
        .catch(error => console.error('Error fetching data:', error));
}

// עדכון כל 2 שניות
setInterval(getPrices, 2000);

// ניהול כפתורי ה-toggle
document.querySelectorAll(".toggle-coin").forEach(button => {
    button.addEventListener('click', function() {
        const coinId = this.id.replace('toggle-', ''); // מזהה המטבע
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            selectedCoins = selectedCoins.filter(coin => coin !== coinId);
        } else {
            this.classList.add('active');
            if (!selectedCoins.includes(coinId)) {
                selectedCoins.push(coinId);
            }
        }

        // אם יש מטבעות שנבחרו, נבצע קריאה לעדכון הגרף
        if (selectedCoins.length > 0) {
            getPrices(); // עדכון הגרף
        }
    });
});