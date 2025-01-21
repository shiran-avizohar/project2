"use strict";

(async () => {
    // Tab toggle function
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

    // Function to retrieve data from API
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

    // Function to display the coins cards on the page
    const renderCoins = async () => {
        try {
            let coins = await getData("https://api.coingecko.com/api/v3/coins/list");
            coins = coins.slice(0, 100);

            const selectedCoins = loadSelectedCoins();

            const html = coins
                .map(
                    (coin) => `
                    <div class="card coin-card" style="width: 18rem;" data-coin-name="${coin.name}">
                        <div class="card-body">
                            <h5 class="card-title">${coin.name}</h5>
                            <p class="card-text"> ${coin.id}</p>
                            <p class="card-text"></p>
                            <button class="btn btn-primary more-info-btn" data-coin="${coin.id}">More Info</button>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input coin-switch" type="checkbox" role="switch" id="switch-${coin.id}">
                            <label class="form-check-label" for="switch-${coin.id}"></label>
                        </div>
                    </div>`
                )
                .join("");

            document.getElementById("cards-container").innerHTML = html;

            // Marking the selected currencies
            selectedCoins.forEach((coinId) => {
                const switchElement = document.getElementById(`switch-${coinId}`);
                if (switchElement) {
                    switchElement.checked = true;
                }
            });

            updateSelectedCoinsDisplay();

            // Listens for a click on the "More Info" button on each coin card
            document.querySelectorAll(".more-info-btn").forEach((button) => {
                button.addEventListener("click", async (event) => {
                    const coinId = event.target.dataset.coin;
                    const coinData = await getData(`https://api.coingecko.com/api/v3/coins/${coinId}`);
                    showCoinInfo(coinData);
                });
            });

            // Handling coins selection with Switch
            document.querySelectorAll('.coin-switch').forEach(function(switchElement) {
                switchElement.addEventListener('change', function() {
                    updateSelectedCoinsDisplay();

                    // Count the number of marked coins
                    let selectedCoins = document.querySelectorAll('.coin-switch:checked').length;

                    if (selectedCoins > 5) {
                        switchElement.checked = false; // Uncheck the last selected
                        alert("You can select up to 5 coins only.");
                    } else {
                        if (switchElement.checked) {
                            console.log('Coin selected: ' + switchElement.id);
                        } else {
                            console.log('Coin unselected: ' + switchElement.id);
                        }
                    }

                    saveSelectedCoins(); // Saving marked coins
                });
            });
        } catch (error) {
            console.error("Error fetching or rendering coins:", error);
        }
    };

    // Update the selected coins display
    const updateSelectedCoinsDisplay = () => {
        const selectedCoins = loadSelectedCoins();

        const selectedCoinsContainer = document.getElementById('selected-coins-container');
        selectedCoinsContainer.innerHTML = '';

        selectedCoins.forEach(coinId => {
            const coinElement = document.createElement('div');
            coinElement.classList.add('selected-coin');
            coinElement.innerText = `Selected: ${coinId}`;
            selectedCoinsContainer.appendChild(coinElement);
        });
    };

    // Display currency information in the modal
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

    // Saving the selected coins in localStorage
    const saveSelectedCoins = () => {
        const selectedCoins = Array.from(document.querySelectorAll('.coin-switch:checked')).map(switchElement => switchElement.id.split('-')[1]);
        localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
    };

    // Loading the selected coins from localStorage
    const loadSelectedCoins = () => {
        const savedCoins = localStorage.getItem('selectedCoins');
        return savedCoins ? JSON.parse(savedCoins) : [];
    };

    // Create the graph
    let chart;
    let dataPoints = {};

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

    // Update the graph
    const updateChart = (data) => {
        const currentTime = new Date();

        if (!chart) {
            console.error("Chart is not initialized yet.");
            return;
        }

        Object.keys(data).forEach((coin, index) => {
            // If there is no line for the currency, we will add it
            if (!dataPoints[coin]) {
                dataPoints[coin] = [];
                chart.options.data.push({
                    type: "line",
                    name: coin,
                    showInLegend: true,
                    dataPoints: dataPoints[coin],
                    color: getRandomColor(index),
                });
            }

            // Update data points
            dataPoints[coin].push({
                x: currentTime,
                y: data[coin].USD
            });

            // If there are too many points, we want to remove the oldest ones
            if (dataPoints[coin].length > 30) {
                dataPoints[coin].shift();
            }
        });

        chart.render();
    };

    // Function that returns a random color for each coin
    const getRandomColor = (index) => {
        const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FF8C33"];
        return colors[index % colors.length];
    };

    // Initialize the graph before starting the update
    initializeChart();

    // Update the price every 2 seconds
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
    }, 2000);
})();

// Function to apply search to the coins
const searchCoins = (searchText) => {
    const coins = document.querySelectorAll('.coin-card');
    coins.forEach((coin) => {
        const coinName = coin.getAttribute('data-coin-name').toLowerCase();
        if (coinName.includes(searchText.toLowerCase())) {
            coin.style.display = 'block';  // Show the coin
        } else {
            coin.style.display = 'none';  // Hide the coin
        }
    });
};

// Listens to the search field
document.getElementById("coin-search").addEventListener("input", (e) => {
    const searchText = e.target.value;
    searchCoins(searchText);  // Perform the search
});

// Listener for clicking the search button
document.getElementById("search-button").addEventListener("click", () => {
    const searchText = document.getElementById("coin-search").value;

    if (searchText.trim() === "") {
        alert("Please enter search text!");
    } else {
        searchCoins(searchText);
    }
});
