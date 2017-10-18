// TODO: Make a RxJS vrsion of the game

const FIXED_RATE = 1000 / 15;

let ctx;

const GRID_SIZE = 20;
const GRID_COUNT = 20;
const CANVAS_SIZE = GRID_SIZE * GRID_COUNT;

window.onload = function () {
    var canvas = document.getElementById('screen');
    // for simplicity make the canvas be rectangular
    canvas.width = canvas.height = CANVAS_SIZE;

    document.addEventListener('keydown', handleKeyEvent);

    ctx = canvas.getContext('2d');

    stop();
}

// snake's x and y velocities
let xVel, yVel;

// snake's x and y start position
let x, y;

// snake's tail
let tailCount, tail;

// apple's x and y position
let ax, ay;

// interval's ID
let isStarted;
function start() {
    if (!isStarted) {
        // for simplicity use setInterval and not a rela game timer with requestAnimationFrame()
        isStarted = setInterval(update, FIXED_RATE);
    }
}

function stop() {
    if (isStarted) {
        clearInterval(isStarted);
        isStarted = undefined;

        alert(`Lost - score ${tailCount}`);
    }
    // reset game
    x = y = GRID_COUNT / 2;
    xVel = yVel = 0;
    tail = [];
    tailCount = 5;
    ax = ay = 15;

    redraw();
}

function handleKeyEvent(event) {
    switch (event.keyCode) {
        case 37:
        case 38:
        case 39:
        case 40:
            start();
    }

    // TODO:  don't allow to move left while moving right, 
    // up while down adn etc.
    switch (event.keyCode) {
        case 37:
            // left (if not alredy moving right)
            if (xVel !== 1) {
                xVel = -1;
                yVel = 0;
            }
            break;
        case 38:
            // up (if not alredy moving down)
            if (yVel !== 1) {
                xVel = 0;
                yVel = -1;
            }
            break;

        case 39:
            // right (if not alredy moving left)
            if (xVel !== -1) {
                xVel = 1;
                yVel = 0;
            }
            break;
        case 40:
            // down (if not alredy moving up)
            if (yVel !== -1) {
                xVel = 0;
                yVel = 1;
            }
            break;
    }
}

function update() {
    // remember the last head
    let xPrev = x, yPrev = y;

    // update position just depending on the velocity (assumenig constant 1 rate)
    x += xVel;
    y += yVel;

    if (x < 0) {
        x = GRID_COUNT - 1;
    }
    if (x > GRID_COUNT - 1) {
        x = 0;
    }
    if (y < 0) {
        y = GRID_COUNT - 1;
    }
    if (y > GRID_COUNT - 1) {
        y = 0;
    }

    // check for END - head bites itself
    let lost = tail.some(t => (t.x === x && t.y === y));
    if (lost) {
        stop();
        return;
    }


    // put the last head as first tail element
    tail.unshift({ x: xPrev, y: yPrev });

    // remove the last
    while (tailCount < tail.length) {
        tail.pop();
    }



    // check for apple bite
    if (ax === x && ay === y) {
        tailCount += 3;
        ax = Math.floor(Math.random() * GRID_COUNT);
        ay = Math.floor(Math.random() * GRID_COUNT);

        // TODO:  check if the apple is not the tail and if then create another
    }

    redraw();
}

function redraw() {
    // draw the whole board
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // draw the apple
    ctx.fillStyle = "red";
    ctx.fillRect(ax * GRID_SIZE, ay * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // draw the snake's head
    ctx.fillStyle = "white";
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    ctx.fillStyle = "lime";
    tail.forEach(t => ctx.fillRect(t.x * GRID_SIZE, t.y * GRID_SIZE, GRID_SIZE, GRID_SIZE));

}