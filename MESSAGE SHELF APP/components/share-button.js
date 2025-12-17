class ShareButton extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          button {
            background: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            cursor: pointer;
          }
          img {
            width: 24px;
            height: 24px;
          }
        </style>
        <button>
          <img src="share.png" alt="Share">
        </button>
      `;
    }
  }
  
  customElements.define('share-button', ShareButton);