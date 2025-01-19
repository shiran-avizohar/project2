"use strict";

(async () => {
    // קוד להפעלת טאב-ים
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

    // שליפת נתונים מה-API
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

    // הצגת כרטיסי המטבעות
    const renderCoins = async () => {
        try {
            let coins = await getData("https://api.coingecko.com/api/v3/coins/list");
            coins = coins.slice(0, 100);  // בוחרים את 100 המטבעות הראשונים
            
            const html = coins
            .map(
                (coin) => `
            <div class="card coin-card" style="width: 18rem;" data-coin-name="${coin.name}">
                <div class="card-body">
                    <h5 class="card-title">${coin.name}</h5>
                    <p class="card-text">ID: ${coin.id}</p>
                    <p class="card-text">Symbol: ${coin.symbol}</p>
                    <button class="btn btn-primary more-info-btn" data-coin="${coin.id}">More Info</button>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input coin-switch" type="checkbox" role="switch" id="switch-${coin.id}">
                    <label class="form-check-label" for="switch-${coin.id}">Select ${coin.name}</label>
                </div>
            </div>`
            )
            .join("");
        
    
            document.getElementById("cards-container").innerHTML = html;

            // טוען את הבחירות שנשמרו ב-localStorage
            loadSelectedCoins();

            // טיפול בבחירת מטבעות עם Switch
            document.querySelectorAll('.coin-switch').forEach(function(switchElement) {
                switchElement.addEventListener('change', function() {
                    // עדכון תצוגת המטבעות שנבחרו
                    updateSelectedCoinsDisplay();
            
                    // סופר את כמות המטבעות המסומנים
                    let selectedCoins = document.querySelectorAll('.coin-switch:checked').length;
            
                    if (selectedCoins > 5) {
                        switchElement.checked = false; // מבטל את הסימון האחרון
                        alert("You can select up to 5 coins only.");
                    } else {
                        // שומר את הבחירה ב-localStorage
                        saveSelectedCoins();
                    }
                });
            });
        } catch (error) {
            console.error("Error fetching or rendering coins:", error);
        }
    };

    // שמירת המטבעות שנבחרו ב-localStorage
    const saveSelectedCoins = () => {
        const selectedCoins = Array.from(document.querySelectorAll('.coin-switch:checked')).map(switchElement => switchElement.id.split('-')[1]);
        localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
    };

    // טעינת המטבעות שנבחרו מ-localStorage
    const loadSelectedCoins = () => {
        const selectedCoins = JSON.parse(localStorage.getItem("selectedCoins")) || [];
        selectedCoins.forEach(coinId => {
            const coinSwitch = document.getElementById(`switch-${coinId}`);
            if (coinSwitch) {
                coinSwitch.checked = true;
            }
        });
    };

    // עדכון תצוגת המטבעות שנבחרו
    const updateSelectedCoinsDisplay = () => {
        const selectedCoins = Array.from(document.querySelectorAll('.coin-switch:checked')).map(switchElement => switchElement.id.split('-')[1]);
        
        const selectedCoinsContainer = document.getElementById('selected-coins-container');
        selectedCoinsContainer.innerHTML = ''; // מחיקת התצוגה הקודמת
    
        selectedCoins.forEach(coinId => {
            const coinElement = document.createElement('div');
            coinElement.classList.add('selected-coin');
            coinElement.innerText = `Selected: ${coinId}`;
            selectedCoinsContainer.appendChild(coinElement);
        });
    };

    // הצגת מידע על מטבע במודל
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

    // יצירת הגרף
    let chart; // הגרף עצמו
    let dataPoints = {}; // נקודות הנתונים

    const initializeChart = () => {
        chart = new CanvasJS.Chart("chartContainer", {
            title: {
                text: "Cryptocurrency Price Chart"
            },
            axisX: {
                title: "Time"
            },
            axisY: {
                title: "Price (USD)"
            },
            data: [],
        });
        chart.render();
    };

    // עדכון הגרף
    const updateChart = (data) => {
        const currentTime = new Date();
    
        if (!chart) {
            console.error("Chart is not initialized yet.");
            return;
        }
        console.log(data)
        Object.keys(data).forEach((coin, index) => {
            // אם לא קיים קו עבור המטבע, נוסיף אותו
            if (!dataPoints[coin]) {
                dataPoints[coin] = [];
                chart.options.data.push({
                    type: "line",
                    name: coin, // שם המטבע שיופיע בלגנד של הגרף
                    showInLegend: true,
                    dataPoints: dataPoints[coin],
                    color: getRandomColor(index), // צבע שונה לכל מטבע
                });
            }
    
            // עדכון נקודות הנתונים
            dataPoints[coin].push({
                x: currentTime,
                y: data[coin].USD
            });
    
            // אם יש יותר מדי נקודות, נרצה להוריד את הישנות ביותר
            if (dataPoints[coin].length > 30) {
                dataPoints[coin].shift();
            }
        });
    
        chart.render();
    };

    // פונקציה שמחזירה צבע אקראי לכל מטבע
    const getRandomColor = (index) => {
        const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FF8C33"];
        return colors[index % colors.length];
    };

    // אתחול הגרף לפני התחלת העדכון
    initializeChart();

    // עדכון המחיר כל 2 שניות
    setInterval(async () => {
        const selectedCoins = Array.from(document.querySelectorAll('.coin-switch:checked')).map(switchElement => switchElement.id.split('-')[1]);
        if (selectedCoins.length === 0) return;

        try {
            console.log("ss", selectedCoins)
            const coinsData = await getData(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins.join(',')}&tsyms=USD`);
            updateChart(coinsData);
        } catch (error) {
            console.error("Error fetching coin data:", error);
        }
    }, 2000); // כל 2 שניות
})();

// פונקציה להחלת חיפוש על המטבעות
const searchCoins = (searchText) => {
    const coins = document.querySelectorAll('.coin-card');
    coins.forEach((coin) => {
        const coinName = coin.getAttribute('data-coin-name').toLowerCase();
        if (coinName.includes(searchText.toLowerCase())) {
            coin.style.display = 'block';  // הצגת המטבע
        } else {
            coin.style.display = 'none';  // הסתרת המטבע
        }
    });
};

// מאזין לשדה החיפוש
document.getElementById("search-input").addEventListener("input", (e) => {
    const searchText = e.target.value;
    searchCoins(searchText);  // הפעלת החיפוש
});


