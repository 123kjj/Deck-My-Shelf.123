class ToyItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        const item = this.getAttribute('item');
        const x = this.getAttribute('x') || '50';
        const y = this.getAttribute('y') || '50';
        const note = this.getAttribute('note') || '';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    cursor: move;
                    z-index: 15;
                }
                
                img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    pointer-events: none;
                }
            </style>
            <div class="toy" data-item="${item}">
                <img src="${item}item.png" alt="Toy ${item}">
            </div>
        `;
        
        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
    }
}

customElements.define('toy-item', ToyItem);