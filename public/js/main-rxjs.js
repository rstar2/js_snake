/* global Rx */

import Store from './redux-rxjs.js';

const FIXED_RATE = 1000 / 15;

const GRID_SIZE = 20;
const GRID_COUNT = 20;
const CANVAS_SIZE = GRID_SIZE * GRID_COUNT;

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
// for simplicity make the canvas be rectangular
canvas.width = canvas.height = CANVAS_SIZE;

// reset game
const initialState = {
    // snake's x and y head position
    x: GRID_COUNT / 2,
    y: GRID_COUNT / 2,

    // snake's x and y velocities
    xVel: 50,
    yVel: 50,

    // snake's tail - length and tiles
    tailCount: 5,
    tail: [],

    // apple's x and y position
    ax: 15,
    ay: 15,

    // interval's ID
    isStarted: undefined
};
const reducer = (state, action) => {
    switch (action) {
        default:
            return state;
    }
};
const store = new Store(reducer, initialState);
store.subscribe(redraw);

Rx.Observable.fromEvent(document, 'keydown').
    map(handleKeyEvent).
    subscribe(action => store.dispatch(action));

Rx.Observable.interval(FIXED_RATE).subscribe(() => {
    update(store.getState());
});

function start() {
    if (!state.isStarted) {
        // for simplicity use setInterval and not a rela game timer with requestAnimationFrame()
        state.isStarted = setInterval(update, FIXED_RATE);
    }
}

function reset() {
    if (state.isStarted) {
        clearInterval(state.isStarted);
        alert(`Lost - score ${state.tailCount}`);
    }

    // reset game
    state.x = state.y = GRID_COUNT / 2;
    state.xVel = state.yVel = 0;
    state.tail = [];
    state.tailCount = 5;
    state.ax = state.ay = 15;
    state.isStarted = undefined;

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
            if (state.xVel !== 1) {
                state.xVel = -1;
                state.yVel = 0;
            }
            break;
        case 38:
            // up (if not alredy moving down)
            if (state.yVel !== 1) {
                state.xVel = 0;
                state.yVel = -1;
            }
            break;

        case 39:
            // right (if not alredy moving left)
            if (state.xVel !== -1) {
                state.xVel = 1;
                state.yVel = 0;
            }
            break;
        case 40:
            // down (if not alredy moving up)
            if (state.yVel !== -1) {
                state.xVel = 0;
                state.yVel = 1;
            }
            break;
    }
}

function update(state) {
    // remember the last head
    let xPrev = state.x, yPrev = state.y;

    // update position just depending on the velocity (assumenig constant 1 rate)
    state.x += state.xVel;
    state.y += state.yVel;

    if (state.x < 0) {
        state.x = GRID_COUNT - 1;
    }
    if (state.x > GRID_COUNT - 1) {
        state.x = 0;
    }
    if (state.y < 0) {
        state.y = GRID_COUNT - 1;
    }
    if (state.y > GRID_COUNT - 1) {
        state.y = 0;
    }

    // check for END - head bites itself
    let lost = state.tail.some(t => (t.x === state.x && t.y === state.y));
    if (lost) {
        reset();
        return;
    }


    // put the last head as first tail element
    state.tail.unshift({ x: xPrev, y: yPrev });

    // remove the last
    while (state.tailCount < state.tail.length) {
        state.tail.pop();
    }



    // check for apple bite
    if (state.ax === state.x && state.ay === state.y) {
        state.tailCount += 3;
        state.ax = Math.floor(Math.random() * GRID_COUNT);
        state.ay = Math.floor(Math.random() * GRID_COUNT);

        // TODO:  check if the apple is not the tail and if then create another
    }
}

function redraw(state) {
    // draw the whole board
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // draw the apple
    ctx.fillStyle = "red";
    ctx.fillRect(state.ax * GRID_SIZE, state.ay * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // draw the snake's head
    ctx.fillStyle = "white";
    ctx.fillRect(state.x * GRID_SIZE, state.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    ctx.fillStyle = "lime";
    state.tail.forEach(t => ctx.fillRect(t.x * GRID_SIZE, t.y * GRID_SIZE, GRID_SIZE, GRID_SIZE));
}