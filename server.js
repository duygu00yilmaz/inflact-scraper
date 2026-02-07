const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

// BU SATIRIN MEVCUT OLDUĞUNDAN EMİN OLUN
app.get('/scrape', async (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ error: 'Username parameter is missing' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        const targetUrl = `https://inflact.com/tr/instagram-viewer/profile/${username}/`;
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });

        await page.waitForTimeout(5000);

        const data = await page.evaluate(() => {
            const profilePicElement = document.querySelector('.result-item__img-wrap img');
            const profilePicUrl = profilePicElement ? profilePicElement.src : null;
            const fullNameElement = document.querySelector('.profile-name');
            const fullName = fullNameElement ? fullNameElement.innerText.trim() : null;
            return { profile_pic_url: profilePicUrl, full_name: fullName };
        });

        await browser.close();

        res.json({
            username: username,
            profile_pic_url: data.profile_pic_url,
            full_name: data.full_name
        });

    } catch (error) {
        if (browser) await browser.close();
        console.error(error);
        res.status(500).json({ error: 'Scraping failed', details: error.message });
    }
});

// SUNUCUYU BAŞLATAN SATIR
app.listen(PORT, () => {
    console.log(`Inflact scraper running on port ${PORT}`);
});
