//Global Constants -------------------------------------------------
const SHOW_CAMERA = true;
const PARTICLE_COUNT = 0;
const N = 20;
const SCALE = 20;
const HUE = {         sadness: 225, fury: 1,    boredom: 40,   excitement: 25 }; // out of 360
const SATURATION = {  sadness: 12,  fury: 100,  boredom: 26,    excitement: 95 }; // out of 100
const LIGHTNESS = {   sadness: 35,  fury: 45,   boredom: 70,    excitement: 50 }; // out of 100
const RANGE = 40;

//Global Variables -------------------------------------------------
let mouse;  
let airParticles = [];
let video;
let handpose;
let predictions = [];
let newHand;
let hands = []; 
let poseNet;
let poses = [];
let fluid;
let t;
let leftHand;
let rightHand;
let prevLX, prevLY;
let prevRX, prevRY;
let sadness = 0;
let fury = 0;
let boredom = 0;
let excitement = 0;
let seed1, seed2, seed3, seed4;
let xoff = 0.0;
let emotions;
let strongestEmotion;
let force = 200;
let VISCOSITY = sadness;
let DENS_DECAY = boredom;


//cited from the handpose docutmentation at https://learn.ml5js.org/#/reference/handpose
const options = {
  flipHorizontal: true, // boolean value for if the video should be flipped, defaults to false
  maxContinuousChecks: Infinity, // How many frames to go without running the bounding box detector. Defaults to infinity, but try a lower value if the detector is consistently producing bad predictions.
  detectionConfidence: 0.8, // Threshold for discarding a prediction. Defaults to 0.8.
  scoreThreshold: 0.75, // A threshold for removing multiple (likely duplicate) detections based on a "non-maximum suppression" algorithm. Defaults to 0.75
  iouThreshold: 0.3, // A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
};

const options2 = {
  architecture: 'MobileNetV1',
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: true,
  minConfidence: 0.5,
  maxPoseDetections: 5,
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: 'single',
  inputResolution: 513,
  multiplier: 1.00,
  quantBytes: 4,
};

//Setup ------------------------------------------------------------
function setup() {
  createCanvas(N * SCALE, N * SCALE);
  colorMode(HSB, 255);
  // background(34, 39, 46);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  frameRate(60);
  noStroke();
  fluid = new Fluid(N, N, SCALE, 0.05, 0.8);
    
  t = 0;

  // handpose = ml5.handpose(video, options, modelLoaded);
  // handpose.on("hand", (results) => {
  //   predictions = results;
  // });

  poseNet = ml5.poseNet(video, options2, modelLoaded); // single can be changed to multiple
  poseNet.on("pose", (results) => {
    poses = results;

    let left = poses[0].pose.leftWrist;
    let right = poses[0].pose.rightWrist;
    let lx, ly;
    let rx, ry;
    lx = map(left.x, 0, 640, 0, N * SCALE);
    ly = map(left.y, 0, 640, 0, N * SCALE);
    rx = map(right.x, 0, 480, 0, N * SCALE);
    ry = map(right.y, 0, 480, 0, N * SCALE);
    leftHand = new Hand("leftWrist", 50, lx, ly);
    rightHand = new Hand("rightWrist", 150, rx, ry);
    hands.push(leftHand);
    hands.push(rightHand);
  });

  // mouseHand = new Hand("mouse", 250);
  // hands.push(mouseHand);
  
  // mouse = createVector(mouseX, mouseY);

  seed1 = random() * 1000; 
  seed2 = random() * 1000; 
  seed3 = random() * 1000; 
  seed4 = random() * 1000; 

  // console.log(hands);
}

//Draw Function ----------------------------------------------------

function draw() {
  push();
  switch (strongestEmotion) {
    case "fury":
      background("#5E091A");
      break;

    case "sadness":
      background("#D0D2D7");
      break;

    case "boredom":
      background("#EEEDE7");
      break;

    case "excitement":
      background("#FFFDD0 ");
      break;

    default:
      background(255);
      break;
  }
  pop();
  // if (SHOW_CAMERA){
  //   push();
  //   translate(640, 0);
  //   scale(-1,1);
  //   image(video, 0, 0, 640, 480);
  //   pop();
  // }

  
  // if (poses[0]){
  //     for (let hand of hands) {
  //         switch(hand.title){
  //             case "mouse": 
  //                 hand.update(mouseX, mouseY); 
  //                 break;
  //             case "leftWrist": 
  //                 if (poses[0].pose.leftWrist.confidence > 0.6){
  //                       hand.update(poses[0].pose.leftWrist.x, poses[0].pose.leftWrist.y); 
  //                       break;
  //                   }
  //             case "rightWrist": 
  //                 if (poses[0].pose.rightWrist.confidence > 0.6) {
  //                       hand.update(poses[0].pose.rightWrist.x, poses[0].pose.rightWrist.y); 
  //                       break;
  //                   }
  //             default: break;
  //         }
  //         hand.draw(); 
  //     }
  // }
            
  xoff = xoff + 0.003;
  
  sadness =    noiseFromSeed(seed1, xoff);
  fury =       noiseFromSeed(seed2, xoff);
  excitement = noiseFromSeed(seed3, xoff);
  boredom =    noiseFromSeed(seed4, xoff);
  
  emotions = { sadness, fury, boredom, excitement };
  
  // console.log(emotions)

  strongestEmotion = Object.entries(emotions).reduce(
    (prev, curr) => prev[1] > curr[1] ? prev : curr)[0];
  
  let dt = frameRate() > 0 ? 1 / (frameRate()) : 0;
  
  fluid.simulate(dt);
  fluid.show(false);
  
  for(let i = 0; i < fluid.w; i++) {
    for(let j = 0; j < fluid.h; j++){
      fluid.density[i][j] -= DENS_DECAY * dt;
      fluid.velocity[i][j].mult(0.99);
    }
  }
  
  if (fury > 0.5) {
    if (random() < 0.8) {
      let randx = ~~(random() * N);
      let randy = ~~(random() * N);
      
      fluid.density[randx][randy] = 15;
      fluid.velocity[randx][randy].add(random() * force * 20, random() * force * 20);
      fluid.velocity[randx][randy].setHeading(random() * TWO_PI);
    } 
  }

  mouseControl();
  handControl();
  // drawTracking();
  // fluid.velocity[x][y].setHeading(random() * TWO_PI);
  // goCrazy();
  // console.log(dt);
}

//Classes ----------------------------------------------------------
class Hand {
  constructor(title, hue, x, y){
    this.position = createVector(x, y);
    this.title = title;
    this.hue = hue;
  }
  draw(){
    push()
    colorMode(HSL, 255);
    fill(this.hue, 255, 128);
    ellipse(this.position.x, this.position.y, SCALE);
    pop()
  }
}

// much of this object and other things related to fluid simulation in this program is derived from krafpy's implementation
// of Jos Stam's Real-Time Fluid Dynamics for Games: https://editor.p5js.org/krafpy/sketches/Xv1uO8IEf
class Fluid {
  constructor(w, h, size, k, nu){
      this.w = w;
      this.h = h;
      this.size = size;
      this.k = k;
      this.nu = nu;
      
      this.density = [];
      this.velocity = [];
      for(let i = 0; i < this.w; ++i){
          this.density.push([]);
          this.velocity.push([]);
          for(let j = 0; j < this.h; ++j){
              this.density[i].push(0);
              /*let u = createVector(i - this.w/2, j - this.h/2);
              let a = u.heading() + HALF_PI;
              let v = createVector(cos(a), sin(a));
              v.mult(u.mag() * 10);*/
              this.velocity[i].push(createVector(0,0));
          }
      }
  }
  
  simulate(dt){
      let xs = [];
      let ys = [];
      for(let i = 0; i < this.w; ++i){
          xs.push([]);
          ys.push([]);
          for(let j = 0; j < this.h; ++j){
            xs[i].push(this.velocity[i][j].x);
            ys[i].push(this.velocity[i][j].y);
          }
      }
      
      this.diffuse(xs, this.nu, dt);
      this.diffuse(ys, this.nu, dt);
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              this.velocity[i][j].x = xs[i][j];
              this.velocity[i][j].y = ys[i][j];
          }
      }
      
      this.clearDivergence();
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              xs[i][j] = this.velocity[i][j].x;
              ys[i][j] = this.velocity[i][j].y;
          }
      }
      
      this.advect(xs, dt);
      this.advect(ys, dt);
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              this.velocity[i][j].x = xs[i][j];
              this.velocity[i][j].y = ys[i][j];
          }
      }
      
      this.clearDivergence();
      
      this.diffuse(this.density, this.k, dt);
      this.advect(this.density, dt);
  }
      
  diffuse(grid, coef, dt){
      let a = dt * coef;
      
      for(let k = 0; k < 10; ++k){
          for(let i = 0; i < this.w; ++i){
              for(let j = 0; j < this.h; ++j){
                  
                  let top     = grid[i][wrap(j + 1, this.h)];
                  let bottom  = grid[i][wrap(j - 1, this.h)];
                  let left    = grid[wrap(i - 1, this.w)][j];
                  let right   = grid[wrap(i + 1, this.w)][j];
                  
                  let curVal = grid[i][j];
                  
                  let newVal = curVal + a * (top + bottom + left + right);
                  newVal /= 4 * a + 1;
                  
                  grid[i][j] = newVal;
              }
          }
      }
  }
  
  advect(grid, dt) {
      let f = createVector(0, 0);
      let fj = createVector(0, 0);
      let fi = createVector(0, 0);
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
          let v = this.velocity[i][j].copy();
          let x = i * this.size;
          let y = j * this.size;
          f.x = x;
          f.y = y;
          v.mult(dt);
          f.sub(v);
          f.mult(1 / this.size);
          f.x = wrap(f.x, this.w);
          f.y = wrap(f.y, this.h);
          fi.x = ~~f.x;
          fi.y = ~~f.y;
          fj.x = f.x - fi.x;
          fj.y = f.y - fi.y;

          // console.log(f.x);

          let z1 = lerp(grid[fi.x][fi.y],
                          grid[wrap(fi.x + 1, this.w)][fi.y],
                          fj.x);
          let z2 = lerp(grid[fi.x][wrap(fi.y + 1, this.h)],
                          grid[wrap(fi.x + 1, this.w)][wrap(fi.y + 1, this.h)],
                          fj.x);
          
          let newVal = lerp(z1, z2, fj.y);
          
          grid[i][j] = newVal;
          }
      }
  }
  
  clearDivergence(){
      let div = [];
      let p = [];
      
      for(let i = 0; i < this.w; ++i){
          div.push([]);
          p.push([]);
          for(let j = 0; j < this.h; ++j){
          let d = this.velocity[wrap(i + 1, this.w)][j].x - 
                  this.velocity[wrap(i - 1, this.w)][j].x +
                  this.velocity[i][wrap(j + 1, this.h)].y - 
                  this.velocity[i][wrap(j - 1, this.h)].y;
          d /= 2;
          div[i].push(d);
          p[i].push(0);
          }
      }
      
      for(let k = 0; k < 20; ++k) {
          for(let i = 0; i < this.w; ++i){
              for(let j = 0; j < this.h; ++j){
                  p[i][j] = -div[i][j] +
                          p[wrap(i - 1, this.w)][j] + p[wrap(i + 1, this.w)][j] +
                          p[i][wrap(j - 1, this.h)] + p[i][wrap(j + 1, this.h)];
                  p[i][j] /= 4;
              }
          }
      }
      
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              this.velocity[i][j].x -= VISCOSITY * (p[wrap(i + 1, this.w)][j] -
                                                    p[wrap(i - 1, this.w)][j]);
              this.velocity[i][j].y -= VISCOSITY * (p[i][wrap(j + 1, this.h)] -
                                                    p[i][wrap(j - 1, this.h)]);
          }
      }
  }
  
  show(showVel){

      const mainPalette = HUE[strongestEmotion];

      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              let x = i * this.size;
              let y = j * this.size;
              if (this.density[i][j] > 0.0) {
                  colorMode(HSL, 360, 100, 100, 100);
                  let medianColor = constrain(mainPalette + this.density[i][j] * 25, mainPalette - RANGE, mainPalette + RANGE);
                  let hue = map(medianColor, mainPalette + this.density[i][j] * 35, mainPalette - RANGE, mainPalette + RANGE, mainPalette - RANGE, mainPalette + RANGE);
                  fill(hue, SATURATION[strongestEmotion], LIGHTNESS[strongestEmotion], this.density[i][j] * 100);
                  rect(x, y, SCALE, SCALE, SCALE);
              }
          }
      }
      
      if(!showVel) return;
      
      push();
      colorMode(RGB);
      fill(255,0,255);
      stroke(255, 0, 255);
      for(let i = 0; i < this.w; ++i){
          for(let j = 0; j < this.h; ++j){
              let vel = this.velocity[i][j];
              if(vel.magSq() == 0) continue;
              let x = i * this.size + this.size/2;
              let y = j * this.size + this.size/2;
              arrow(createVector(x, y), vel);
          }
      }
      pop();
  }
}

//Misc Functions ----------------------------------------------------

function modelLoaded() {
  console.log("Model Loaded!");
}

function noiseFromSeed(seed, xoff) {
  noiseSeed(seed);
  return noise(xoff);
}

function wrap(x, m){
  return Math.abs(x + m) % m;
}

function arrow(pos, dir){
  line(pos.x, pos.y, pos.x + dir.x, pos.y + dir.y);
  push();
  translate(pos.x + dir.x, pos.y + dir.y);
  rotate(dir.heading() - HALF_PI);
  triangle(-3,-2, 3,-2, 0,4);
  pop();
}

function handControl() { 
  if (hands.length > 0) {
      let lx = constrain(floor(leftHand.position.x/SCALE), 0, N-1);
      let ly = constrain(floor(leftHand.position.y/SCALE), 0, N-1);
      let rx = constrain(floor(rightHand.position.x/SCALE), 0, N-1);
      let ry = constrain(floor(rightHand.position.y/SCALE), 0, N-1);
    
    
      let amtLX = leftHand.position.x - prevLX;
      let amtLY = leftHand.position.y - prevLY;
      let amtRX = rightHand.position.x - prevRX;
      let amtRY = rightHand.position.y - prevRY;  
      
      prevLX = leftHand.position.x;
      prevLY = leftHand.position.y;
      prevRX = rightHand.position.x;
      prevRY = rightHand.position.y;
    
      leftHand.draw()
      rightHand.draw()

      switch (strongestEmotion) {
        case "boredom":
          force = 200;
          VISCOSITY = 0.5;
          DENS_DECAY = 0.9;

          fluid.density[lx][ly] = 7;
          fluid.density[rx][ry] = 7;

          fluid.velocity[lx][ly].add(force * amtLX, force * amtLY).setHeading(fluid.velocity[lx][ly].heading() + PI);
          fluid.velocity[rx][ry].add(force * amtRX, force * amtRY).setHeading(fluid.velocity[rx][ry].heading() + PI);
          break;

        case "sadness":
          force = 200;
          VISCOSITY = 0.3;
          DENS_DECAY = 0.8;

          fluid.density[lx][ly] = 7;
          fluid.density[rx][ry] = 7;

          fluid.velocity[lx][ly].setMag(force).setHeading(HALF_PI);
          fluid.velocity[rx][ry].setMag(force).setHeading(HALF_PI);
          break;

        case "fury": 
          force = 500;
          VISCOSITY = 0.8;
          DENS_DECAY = 1.0;

          fluid.density[lx][ly] = 7;
          fluid.density[rx][ry] = 7;

          fluid.velocity[lx][ly].add(force * amtLX, force * amtLY);
          fluid.velocity[rx][ry].add(force * amtRX, force * amtRY);
          break;

        case "excitement":
          force = 5000;
          VISCOSITY = 0.01;
          DENS_DECAY = 1;

          fluid.density[wrap(lx-1, SCALE)][ly] = 1;
          fluid.density[lx][wrap(ly-1, SCALE)] = 1;
          fluid.density[wrap(lx+1, SCALE)][ly] = 1;
          fluid.density[lx][wrap(ly+1, SCALE)] = 1;

          fluid.density[wrap(rx-1, SCALE)][ry] = 1;
          fluid.density[rx][wrap(ry-1, SCALE)] = 1;
          fluid.density[wrap(rx+1, SCALE)][ry] = 1;
          fluid.density[rx][wrap(ry+1, SCALE)] = 1;

          fluid.velocity[wrap(lx-1, SCALE)][ly].add(force, force).setHeading(2 * HALF_PI);
          fluid.velocity[lx][wrap(ly-1, SCALE)].add(force, force).setHeading(3 * HALF_PI);
          fluid.velocity[wrap(lx+1, SCALE)][ly].add(force, force).setHeading(4 * HALF_PI);
          fluid.velocity[lx][wrap(ly+1, SCALE)].add(force, force).setHeading(5 * HALF_PI);

          fluid.velocity[wrap(rx-1, SCALE)][ry].add(force, force).setHeading(2 * HALF_PI);
          fluid.velocity[rx][wrap(ry-1, SCALE)].add(force, force).setHeading(3 * HALF_PI);
          fluid.velocity[wrap(rx+1, SCALE)][ry].add(force, force).setHeading(4 * HALF_PI);
          fluid.velocity[rx][wrap(ry+1, SCALE)].add(force, force).setHeading(5 * HALF_PI);
          break;
        default:
          break;
      }
  } 
}

function mouseControl() { 
  if (mouseIsPressed === true) {
    let x = constrain(~~(mouseX/SCALE), 0, N-1);
    let y = constrain(~~(mouseY/SCALE), 0, N-1);
    
    let amtX = mouseX - pmouseX;
    let amtY = mouseY - pmouseY;
    
    switch (strongestEmotion) {
      case "boredom":
        force = 200;
        
        fluid.density[x][y] = 15;

        fluid.velocity[x][y].add(force * amtX, force * amtY).setHeading(fluid.velocity[x][y].heading() + PI);
        break;
        
      case "sadness":
        force = 200;

        fluid.density[x][y] = 15;

        fluid.velocity[x][y].setMag(force).setHeading(HALF_PI * sadness);
        break;
        
      case "fury": 
        force = 500;

        fluid.density[x][y] = 15;

        fluid.velocity[x][y].add(force * amtX, force * amtY);
        break;    
        
      case "excitement":  
        force = 10000;

        fluid.density[wrap(x-1, SCALE)][y] = 5;
        fluid.density[x][wrap(y-1, SCALE)] = 5;
        fluid.density[wrap(x+1, SCALE)][y] = 5;
        fluid.density[x][wrap(y+1, SCALE)] = 5;

        fluid.velocity[wrap(x-1, SCALE)][y].add(force, force).setHeading(2 * HALF_PI);
        fluid.velocity[x][wrap(y-1, SCALE)].add(force, force).setHeading(3 * HALF_PI);
        fluid.velocity[wrap(x+1, SCALE)][y].add(force, force).setHeading(4 * HALF_PI);
        fluid.velocity[x][wrap(y+1, SCALE)].add(force, force).setHeading(5 * HALF_PI);


        break;

      default:
        break;
    }

  }
}

// function excitementTrigger() {
//   if () {

//   }
// }

/*TODOs -----------------------------------------------------------

Change size of camera to match size of screen 
  - might be done with .imageScaleFactor
Adjust the confidence levels and make the movements more fluid
Make hand skelleton (avatar)

*/