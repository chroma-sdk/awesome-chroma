/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Search developers.google.com/web for articles tagged
 * "Headless Chrome" and scrape results from the results page.
 */


const puppeteer = require('puppeteer');
const fs = require('fs');

puppeteer.launch({
  headless: false,
}).then(async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 800,
  });

  await page.goto('https://www2.razer.com/chroma-workshop/games');
  await page.waitForSelector('.preloader', { hidden: true });

  await page.screenshot({
    path: 'screenshots/1.png',
  });


  // Type into search box.
  //   await page.type('#searchbox input', 'Headless Chrome');

  // Wait for suggest overlay to appear and click "show all results".
  const sortSelector = '.filter-area.profiles-filter-button';
  await page.waitForSelector(sortSelector);
  await page.click(sortSelector);

  await page.screenshot({
    path: 'screenshots/clicked-filter.png',
  });

  const sortNameSelector = '.filter-area.game-sort-name';
  await page.waitForSelector(sortNameSelector);
  await page.click(sortNameSelector);

  await page.waitFor(1000);
  await page.screenshot({
    path: 'screenshots/sort-by-name.png',
  });

  //   // Wait for the results page to load and display the results.
  const resultsSelector = '.grid-item.new-games.element-item:not(.utility)';
  await page.waitForSelector(resultsSelector);

  // page.on('console', (msg) => {
  //   for (let i = 0; i < msg.args().length; i + 1) { console.log(`${i}: ${msg.args()[i]}`); }
  // });

  //   // Extract the results from the page.
  const { games, } = await page.evaluate(selector =>
    ({
      games: Array.from(document.querySelectorAll(selector)).map(game => ({
        title: game.querySelector('.game-title').innerText,
        url: game.querySelector('.open-popup-link').href,
        image: game.querySelector('img').src,
      }))
      .sort((a, b) => {
        const c = a.title.toLowerCase();
        const d = b.title.toLowerCase();
        if (c > d) {
          return 1;
        } else if (c < d) {
          return -1;
        }
        return 0;
      })
      .map(x => `[<img alt="${x.title}" src="${x.image}" width="130" />](${x.url})`)
      .join('\r\n'),
    }), resultsSelector);

  await fs.writeFile(
    'Games.md',
    `# Games

> This file has been generated automatically by crawling the [Chroma Workshop](https://www2.razer.com/chroma-workshop/games)

${games}`, (err) => {
      if (err) throw err;
    },
  );

  await fs.readFile('Readme.md', (err, data) => {
    if (err) throw err;
    let text = data.toString();
    text = text.replace(/(?<=<!-- autobot:games:start -->)(.*)(?=<!-- autobot:games:end -->)/s, `\r\n${games}\r\n`);
    fs.writeFile(
      'Readme.md',
      text, (err) => {
        if (err) throw err;
      },
    );
  })

  await browser.close();
});
