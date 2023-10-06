
let count = 0;
let trades = 0;
const startingPlayers = 100;
// this class describes the properties of a single particle.
class Particle {
  // setting the co-ordinates, radius and the
  // speed of a particle in both the co-ordinates axes.
  constructor() {
    this.name = getName(7, 'name');
    this.cash = 2500;
    this.assets = { [assets[0].name]: random(100, 10000) }; //{name:qty}
    this.networth = this.getNetworth();
    this.x = random(0, width);
    this.y = random(0, height);
    this.xSpeed = random(-3, 3);
    this.ySpeed = random(-2, 2);
    this.color = { r: random(50, 255), g: random(50, 255), b: random(50, 255) };
    this.isAlive = true;
    this.connections = [];
    this.size = this.getSize();
  }

  createParticle() {
    strokeWeight(3);
    stroke(this.color.r, this.color.g, this.color.b);
    fill(this.color.r, this.color.g, this.color.b);
    let size = this.getSize();
    console.log('size: ', size);
    circle(this.x, this.y, size);
  }

  moveParticle() {
    if(!this.isAlive) return;
    if (this.x < 0 || this.x > width)
      this.xSpeed *= -1;
    if (this.y < 0 || this.y > height)
      this.ySpeed *= -1;
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }

  killParticle() {
    this.isAlive = false;
    console.log("kill ", this.name);
    let index = particles.indexOf(this);
    if(index > 0){
      particles.splice(index,1);
    }
  }

  joinParticles(particles) {
    particles.forEach(element => {
      if (this.name !== element.name && this.isAlive && element.isAlive)  {
        let dis = dist(this.x, this.y, element.x, element.y);
        if (dis < 100) {
          if (!this.connections.includes(element)) {
            // console.log(`adding connection between ${this.name} and ${element.name}`);
            this.connections.push(element);
            let upOrDown = random() > .5 ? 1 : -1;
            this.tradeAsset(element, assets[0].name, upOrDown * 100);
          }
          const aveR = (this.color.r + element.color.r) / 2;
          const aveG = (this.color.g + element.color.g) / 2;
          const aveB = (this.color.b + element.color.b) / 2;
          strokeWeight(1);
          stroke(aveR, aveG, aveB);
          line(this.x, this.y, element.x, element.y);
          this.color = {
            r: (aveR + 2 * this.color.r) / 3,
            g: (aveG + 2 * this.color.g) / 3,
            b: (aveB + 2 * this.color.b) / 3
          };
        }
        else {
          let index = this.connections.indexOf(element);
          if(index > 0){
            this.connections.splice(index, 1);
            // console.log(`${index}: severing connection between ${this.name} and ${element.name}`);
          }
        }
      }
    });
  }

  tradeAsset(agent, assetName, shares) {
    this.getNetworth();
    trades++;
    let asset = assets.filter(a => a.name === assetName)[0];
    let targetAsset = this.assets[asset.name];
    let agentAsset = agent.assets[asset.name];
    let sharePortion = shares / asset.qty;
    let price = asset.price;
    if ((shares < 0 && targetAsset > -shares) && (agent.cash >= asset?.price * shares)) {
      // sell
      price *= 1 + sharePortion;
      targetAsset -= shares;
      this.cash += price * shares;
      agentAsset += shares;
      agent.cash -= price * shares;
      // console.log(`agent: ${this.name} sold ${-shares} shares of ${asset.name} to agent: ${agent.name} for ${asset.price} per share`);
    }
    if (shares > 0 && this.cash >= asset.price * shares) {
      // buy
      price *= 1 + sharePortion;
      targetAsset += shares;
      this.cash -= price * shares;
      agentAsset -= shares;
      agent.cash += price * shares;
      // console.log(`agent: ${this.name} bought ${shares} shares of ${asset.name} to agent: ${agent.name} for ${asset.price} per share`);
    }
    asset.price = price;
    // console.log("agent: ", this);
    // console.log(`${shares > 0 ? 'BUY' : "SELL"} agent: ${this.name} networth: ${this.assets[assets[0].name] * assets[0].price + this.cash}`);
    let assetValue = 0;
    for (let asset in assets) {
      assetValue += this.assets[asset.name] * asset.price;
    }
    if (this.cash <= 0 || assetValue <= 0) {
      this.killParticle();
    }
  }

  getNetworth(){
    let portfolio = 0;
    for(const [key,value] of Object.entries(this.assets)){
      let asset = assets.filter(a => a.name === key)[0];
      portfolio+=asset.price*value;
    }
    return portfolio+this.cash;
  }

  getSize(){
    console.log(`${this.name}: ${particles.indexOf(this)}`)
    return (particles.length - particles.indexOf(this))/(particles.length/50);
  }
}

class Asset {
  constructor() {
    this.name = getName(3, 'ticker');
    this.price = 20;
    this.qty = floor(random(10000, 100000));
    this.dividend = random(0, 20) / 100;
  }
}

const compareColors = (color1, color2) => {
  return Math.abs(color1.r - color2.r) / color1.r <= 0.2 && Math.abs(color1.g - color2.g) / color1.g <= 0.2 && Math.abs(color1.b - color2.b) / color1.b <= 0.2;
};

// an array to add multiple particles
let particles = [];
let assets = [];

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  let newAsset = new Asset();
  // console.log("initial asset name: ", newAsset.name);
  assets.push(newAsset);
  for (let i = 0; i < startingPlayers; i++) {
    particles.push(new Particle());
  }
  buildTickerBoard();
}
// also correlate size and color to cash and shares
  const buildTickerBoard = () => {
    let board;
    if(document.getElementById("ticker-board") === null){
      // console.log("creating board");
      board = document.createElement('div');
      board.id = "ticker-board";
      document.body.insertBefore(board,document.getElementById('#defaultCanvas0'));
    }
    else{
      board = document.getElementById("ticker-board");
    }
    
    for(let asset of assets){
      let priceQuote;
      if(document.getElementById(`priceQuote-${asset?.name}`) === null){
        priceQuote = document.createElement('div');
        priceQuote.id = `priceQuote-${asset?.name}`;
        board.append(priceQuote);
      }
      else{
        priceQuote = document.getElementById(`priceQuote-${asset?.name}`);
      }
      priceQuote.innerHTML = `<span>${asset?.name}: $${floor(asset?.price*100)/100}</span><br/><span>trades: ${trades}</span><br/><span>players left: ${particles.length}</span>`;
    }
  }
function draw() {
  count ++;
  // console.log("particles: ", particles);
  background("#0f0f0f");
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].isAlive) {
      particles[i].createParticle();
      particles[i].moveParticle();
      particles[i].joinParticles(particles.slice(i));
    }
  }
  buildTickerBoard();
  particles.sort((a,b) => b.networth - a.networth)
}

const getName = (chars, type) => {
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  let name = '';
  if (type === 'ticker') {
    for (let i = 0; i < chars; i++) {
      name += random(alphabet);
    }
  }
  else if (type === 'name') {
    for (let i = 0; i < chars; i++) {
      name += random(i % 2 ? consonants : vowels);
    }
  }
  return name;
}