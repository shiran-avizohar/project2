"use strict";

(async () => {

    document.addEventListener('DOMContentLoaded', () => {
        // הפונקציה להסתיר ולהציג את ה-sections
        const toggleSections = (sectionToShow) => {
            // נסיר את כל התצוגות הנוכחיות
            const sections = document.querySelectorAll('main section');
            sections.forEach(section => {
                section.classList.add('d-none');  // נסתר את כל ה-sections
            });
    
            // נוודא שה-sections המתאים מוצג
            const section = document.getElementById(sectionToShow);
            if (section) {
                section.classList.remove('d-none');  // נוודא שה-`section` המתאים יוצג
            }
        };
    
        // מאזינים ללחיצות על כפתורי הניווט
        document.getElementById('navCoins').addEventListener('click', () => {
            toggleSections('coins');  // מציג את עמוד המטבעות
        });
    
        document.getElementById('navReports').addEventListener('click', () => {
            toggleSections('reports');  // מציג את עמוד הדוחות
        });
    
        document.getElementById('navAbout').addEventListener('click', () => {
            toggleSections('about');  // מציג את עמוד האודות
        });
    
        // ברירת מחדל - נוודא שהעמוד הראשון מוצג כשנטען
        toggleSections('coins');  // מציג את עמוד המטבעות כבר מההתחלה
    });



    const getData = async (url) => fetch(url).then(response => response.json())

    const fetchRetry = async (url) => {
        let isSuccess = false;
        do {
            try {
                const data = await getData(url)
                isSuccess = true
            } catch (e) {
                setTimeout(() => {
                    fetchRetry(url)
                }, 5000)               
            }
        } while (!isSuccess)
    }

    

    const getAllCoins = async () => getData('https://api.coingecko.com/api/v3/coins/list')

    const getSingleCoin = async (coin) => fetchRetry(`https://api.coingecko.com/api/v3/coins/${coin}`)
    const getGraphData = async (coins) => getData(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(',')}&tsyms=USD`);
    let coins = await getAllCoins();
    coins = coins.slice(0,100);
    console.log(coins)
    const search = prompt('search coins')
    const filtered = coins.filter(coin => coin.name.includes(search)).splice(0, 100)
    console.log(filtered)
    const html = coins
        .map(coin => `
            <div class="card-group">
            <div class="card" style="width: 18rem;">
            <img src="https://api.coingecko.com/api/v3/coins/bitcoin${coin.image}" class="card-img-top" alt="${coin.name}">
            <div class="card-body">
                <h5 class="card-title">${coin.name}</h5>
                <p class="card-text">${coin.id}</p>
                <p class="card-text">${coin.symbol}</p>
                <a href="https://www.coingecko.com/en/coins/${coin.id}" class="btn btn-primary">More Info</a>
            </div>
        </div>
        `)
        .join('')





    document.getElementById('cards-container').innerHTML = html;

    const buttonClicked = function () {
        console.log(this.id)
    }

    document.querySelectorAll('#cards-container button').forEach(button => button.addEventListener('click', buttonClicked))


})()

