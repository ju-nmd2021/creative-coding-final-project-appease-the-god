const N = 25;
const size = 20;
const h = N * size;
const dt = 0.2;

let x = mouseX;
let y = mouseY;
let x0 = pmouseX;
let y0 = pmouseY;

let v = createVector(x, y);
let v0 = createVector(x0, y0);
let d = new Array((N+2) * (N+2));
let d0 = new Array((N+2) * (N+2));

function IX(x, y) {
    return x + y * (N+2);
}

function addSource(N, d, d0, dt) {
    let size = (N+2) * (N+2);

    for (let i = 0; i < size; i++) {
        d[i] += dt * d0[i];
    }
}

function diffuse(N, b, x, x0, diff, dt) {
    let a = dt * diff * N * N;

    for (let k = 0; k < 20; k++) {
        for (let i = 0; i <= N; i ++) {
            for (let j = 0; j <= N; i++) {
                x[IX(i,j)] = (x0[IX(i,j)] + a*(x[IX(i-1,j)] + x[IX(i+1,j)] + x[IX(i,j-1)] + x[IX(i,j+1)])) / (1 + 4*a);
            }
        }
    }

    set_bnd(N, b, x); 
}

function advect(N, b, d, d0, v, dt) {
    let x;
    let y;
    let i;
    let i0;
    let i1;
    let j;
    let j0;
    let j1;
    let s0; 
    let s1; 
    let t0;
    let t1; 
    let dt0 = dt * N;

    for (i = 0; i <= N; i ++) {
        for (j = 0; j <= N; i++) {
            x = i - dt0 * v.x;
            y = j - dt0 * v.y;

            if (x < 0.5) x = 0.5;
            if (y < 0.5) y = 0.5;
            if (x > N + 0.5) x = N + 0.5;
            if (y > N + 0.5) y = N + 0.5;

            i0 = Math.floor(x);
            i1 = i0 + 1;
            j0 = Math.floor(y);
            j1 = j0 + 1;

            s1 = x - i0;
            s0 = 1 - s1;
            
            t1 = x - j0;
            t0 = 1 - t1;

            d[IX(i,j)] = s0 * (t0*d0[IX(i0,j0)] + t1*d0[IX(i0,j1)]) + s1 * (t0*d0[IX(i1,j0)] + t1*d0[IX(i1,j1)]);
        }
    }

    set_bnd(N, b, d);
}

function densStep (N , x, x0, v, diff, dt) {
    let tmp_;
    let tmp;

    addSource(N, x, x0, dt);
    
    tmp_ = x0;
    x0 = x;
    x = tmp;

    diffuse(N, 0, x, x0, diff, dt);
    advect(N, 0, x, x0, v.x, v.y, dt);
}

function setup() {
    createCanvas(h, h);
    background(255);
    push();
    stroke(0, 100);
    for (let i = 0; i < N; i++) {
        line(i * size, 0, i * size, h);
        line(0, i * size, h, i * size);
    }
    pop();
}

function draw() {
}