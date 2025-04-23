// == YGO Embed and Decklist Script ==

// Main loader

document.addEventListener('DOMContentLoaded', async function () {
    console.log("✅ YGO embed script loaded");
  
    // --- CSS Injection ---
    const style = document.createElement('style');
    style.textContent = `
      .ygo-embed-container {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-direction: row;
        background-color: #394042;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        border: 2px solid #5c696d;
        color: #ffffff;
      }
  
      @media (max-width: 600px) {
        .ygo-embed-container {
          flex-direction: column;
          align-items: center;
        }
      }
  
      .ygo-card-image-container {
        flex: 0 0 auto;
        text-align: center;
      }
  
      .ygo-card-image {
        width: 250px;
        height: 364px;
        object-fit: cover;
        cursor: zoom-in;
        border: none;
        display: block;
        margin: 0 auto;
      }
  
      .ygo-card-details {
        font-family: Arial, sans-serif;
        line-height: 1.5;
        color: #ffffff;
        flex: 1;
      }
  
      .ygo-card-name {
        margin: 0 0 8px;
        font-size: 1.2em;
        color: #ffffff;
      }
  
      .ygo-card-type-line,
      .ygo-card-oracle-text,
      .ygo-card-price {
        margin: 4px 0;
        color: #ffffff;
      }
  
      .ygo-card-price {
        font-size: 0.9em;
      }
  
      .hover-card {
        color: #d8232f;
        font-weight: bold;
        cursor: pointer;
        text-decoration: none;
      }
  
      .hover-card:hover {
        opacity: 0.8;
      }
  
      .ygo-decklist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
        margin: 12px 0;
        padding: 0;
      }
  
      .ygo-decklist-card {
        text-align: center;
        font-size: 0.8em;
        line-height: 1.3;
      }
  
      .ygo-decklist-card img {
        width: 100%;
        max-width: 120px;
        height: auto;
        border-radius: 2px !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        margin-bottom: 4px;
        display: block;
        margin-left: auto;
        margin-right: auto;
        cursor: zoom-in;
      }
  
      .ygo-decklist-card .card-qty {
        display: block;
        margin-top: 2px;
        font-weight: bold;
        color: #fff;
      }
  
      .ygo-decklist-card a {
        color: #fff;
        text-decoration: none;
        font-weight: bold;
        display: block;
        margin-top: 4px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  
    const cardCache = {};
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    let lastTapped = null;
  
    const hoverDiv = document.createElement('div');
    Object.assign(hoverDiv.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '9999',
      display: 'none',
      maxWidth: '90vw'
    });
    document.body.appendChild(hoverDiv);
  
    window.addEventListener('scroll', () => {
      if (hoverDiv.style.display === 'block' && lastTapped) {
        const rect = lastTapped.getBoundingClientRect();
        hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
        hoverDiv.style.left = '50%';
        hoverDiv.style.transform = 'translateX(-50%)';
      }
    });
  
    // Convert decklist text to HTML structure
    document.querySelectorAll('p').forEach(p => {
      const matchEmbed = p.textContent.trim().match(/^embed::(.+)$/i);
      const matchDeck = p.textContent.trim().match(/^deck::(main|extra|side|upgrade)::\[(.*)\]$/i);

  
      if (matchEmbed) {
        const cardName = matchEmbed[1].trim();
        const wrapper = document.createElement('div');
        wrapper.className = 'ygo-card-embed';
        wrapper.setAttribute('data-card-name', cardName);
        wrapper.innerHTML = '<br>';
        p.replaceWith(wrapper);
      } else if (matchDeck) {
        const section = matchDeck[1];
        const names = JSON.parse(`[${matchDeck[2]}]`);
        const container = document.createElement('div');
        container.className = 'ygo-decklist';
        container.setAttribute('data-deck-section', section);
        container.setAttribute('data-card-names', JSON.stringify(names));
        p.replaceWith(container);
      }
    });
  
    // Hover preview setup
    function setupHoverPreviews() {
      document.querySelectorAll('.dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4').forEach(node => {
        node.innerHTML = node.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `<span class="hover-card" data-card-name="${name}">${name}</span>`);
      });
  
      document.querySelectorAll('.hover-card').forEach(elem => {
        elem.addEventListener('mouseenter', async function (e) {
          if (isMobile) return;
          await loadHover(this.dataset.cardName, e);
        });
  
        elem.addEventListener('mousemove', e => {
          if (!isMobile) positionHover(e);
        });
  
        elem.addEventListener('mouseleave', () => {
          if (isMobile) return;
          hoverDiv.style.display = 'none';
        });
  
        elem.addEventListener('click', async function (e) {
          e.preventDefault();
          const name = this.dataset.cardName;
          if (!cardCache[name]) await loadHover(name, e);
          if (isMobile) {
            if (lastTapped === this) {
              window.open(cardCache[name].imgLarge, '_blank');
              hoverDiv.style.display = 'none';
              lastTapped = null;
            } else {
              lastTapped = this;
              showHover(cardCache[name].imgSmall);
              const rect = this.getBoundingClientRect();
              hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
              hoverDiv.style.left = '50%';
              hoverDiv.style.transform = 'translateX(-50%)';
            }
          } else {
            window.open(cardCache[name].imgLarge, '_blank');
          }
        });
      });
    }
  
    async function loadHover(name, e) {
      if (cardCache[name]) return showHover(cardCache[name].imgSmall);
      try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        const card = data.data[0];
        cardCache[name] = {
          imgSmall: card.card_images[0].image_url_small,
          imgLarge: card.card_images[0].image_url
        };
        showHover(cardCache[name].imgSmall);
        if (!isMobile) positionHover(e);
      } catch (err) {
        console.error('Error loading hover image:', err);
      }
    }
  
    function showHover(url) {
      hoverDiv.innerHTML = `<img src="${url}" style="width:177px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
      hoverDiv.style.display = 'block';
    }
  
    function positionHover(e) {
      const hoverWidth = 200;
      const offset = 15;
      let x = e.clientX + offset;
      let y = e.clientY + offset;
      if (x + hoverWidth > window.innerWidth) x = e.clientX - hoverWidth - offset;
      if (y + 250 > window.innerHeight) y = e.clientY - 250 - offset;
      hoverDiv.style.top = `${y + window.scrollY}px`;
      hoverDiv.style.left = `${x + window.scrollX}px`;
      hoverDiv.style.transform = 'none';
    }
  
    setupHoverPreviews();
  
    if (isMobile) {
      document.addEventListener('click', (e) => {
        const tappedCard = e.target.closest('.hover-card');
        if (!tappedCard) {
          hoverDiv.style.display = 'none';
          lastTapped = null;
        }
      });
    }
  
    // Full card embeds
    document.querySelectorAll('.ygo-card-embed').forEach(async embedDiv => {
      const cardName = embedDiv.getAttribute('data-card-name');
      try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`);
        const data = await res.json();
        const card = data.data[0];
  
        const imgUrl = card.card_images[0].image_url;
  
        const container = document.createElement('div');
        container.className = 'ygo-embed-container';
  
        const imgContainer = document.createElement('div');
        imgContainer.className = 'ygo-card-image-container';
  
        const imgLink = document.createElement('a');
        imgLink.href = imgUrl;
        imgLink.target = '_blank';
        imgLink.rel = 'noopener nofollow';
  
        const img = document.createElement('img');
        img.className = 'ygo-card-image';
        img.src = imgUrl;
        img.alt = card.name;
  
        imgLink.appendChild(img);
        imgContainer.appendChild(imgLink);
        container.appendChild(imgContainer);
  
        const details = document.createElement('div');
        details.className = 'ygo-card-details';
  
        const descHTML = card.desc.replace(/\n/g, '<br><br>');
  
        let statsHTML = `<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin-bottom:12px;">`;
        statsHTML += `<div><strong>Type:</strong> ${card.type}</div>`;
  
        if (card.type.includes("Monster")) {
          statsHTML += `<div><strong>Attribute:</strong> ${card.attribute || 'N/A'}</div>`;
          statsHTML += `<div><strong>Typing:</strong> ${card.race}</div>`;
          statsHTML += `<div><strong>Level/Rank:</strong> ${card.level || card.rank || 'N/A'}</div>`;
          statsHTML += `<div><strong>ATK:</strong> ${card.atk !== undefined ? card.atk : 'N/A'}</div>`;
          if (card.linkval !== undefined) {
            statsHTML += `<div><strong>Link:</strong> ${card.linkval}</div>`;
          } else {
            statsHTML += `<div><strong>DEF:</strong> ${card.def !== undefined ? card.def : 'N/A'}</div>`;
          }
        }
  
        statsHTML += `</div>`;
  
        const tcgPrice = card.card_prices?.[0]?.tcgplayer_price || 'N/A';
        const mkPrice = card.card_prices?.[0]?.cardmarket_price || 'N/A';
  
        const priceHTML = 
          `<p class="ygo-card-price">
            <strong>TCGplayer:</strong> $${tcgPrice}<br>
            <strong>Cardmarket:</strong> €${mkPrice}
          </p>`;
  
        details.innerHTML = 
          `<h4 class="ygo-card-name">${card.name}</h4>
          ${statsHTML}
          <p class="ygo-card-oracle-text">${descHTML}</p>
          ${priceHTML}`;
  
        container.appendChild(details);
        embedDiv.innerHTML = '';
        embedDiv.appendChild(container);
      } catch (err) {
        console.error('Error loading card:', err);
        embedDiv.textContent = 'Error loading card data.';
      }
    });
  
    // Decklist render
    document.querySelectorAll('.ygo-decklist').forEach(async section => {
      const titleMap = {
        main: 'Main Deck',
        extra: 'Extra Deck',
        side: 'Side Deck',
        upgrade: null
      };
      const deckType = section.getAttribute('data-deck-section');
      const names = JSON.parse(section.getAttribute('data-card-names'));
      const container = document.createElement('div');
      container.className = 'ygo-deck-section';
      if (titleMap[deckType]) {
        container.innerHTML = `<h3 class="ygo-deck-title">${titleMap[deckType]}</h3>`;
      }
      const grid = document.createElement('div');
      grid.className = 'ygo-decklist-grid';
  
      for (let entry of names) {
        const [name, qtyStr] = entry.split(/\sx(\d+)$/);
        const qty = parseInt(qtyStr) || 1;
        try {
          const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name.trim())}`);
          const data = await res.json();
          const card = data.data[0];
  
          for (let i = 0; i < qty; i++) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'ygo-decklist-card';
          
            const img = document.createElement('img');
            img.src = card.card_images[0].image_url_small;
            img.alt = name;
            img.title = name;
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => window.open(card.card_images[0].image_url, '_blank'));
          
            const nameLink = document.createElement('a');
            nameLink.textContent = name.trim();
            nameLink.href = card.card_images[0].image_url;
            nameLink.target = '_blank';
            nameLink.rel = 'noopener nofollow';
            nameLink.style.display = 'block';
            nameLink.style.marginTop = '4px';
            nameLink.style.color = '#fff';
            nameLink.style.textDecoration = 'none';
            nameLink.style.cursor = 'pointer';
          
            cardDiv.appendChild(img);
            cardDiv.appendChild(nameLink);
            grid.appendChild(cardDiv);
          }
  
        } catch (err) {
          console.warn(`❌ Could not load card: ${name}`, err);
        }
      }
  
      container.appendChild(grid);
      section.appendChild(container);
    });
  });