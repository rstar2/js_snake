/* global Rx */

import { Store, asyncDispatchMiddleware } from './redux-rxjs.js';

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
    xVel: 1,
    yVel: 1,

    // snake's tail - length and tiles
    tailCount: 5,
    tail: [],

    // apple's x and y position
    ax: 15,
    ay: 15,

    // game's started state
    isStarted: false
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'START':
            return reducerStartReset(state, true);
        case 'RESET':
            return reducerStartReset(state, false);
        case 'KEY_EVENT':
            return reducerKeyEvent(state, action.payload);
        case 'UPDATE':
            return reduceUpdate(state, action.asyncDispatch);
        default:
            return state;
    }
};

function reducerStartReset(state, toStart) {
    if (!state.isStarted && toStart) {
        return Object.assign({}, state, { isStarted: true });
    } else if (state.isStarted && !toStart) {
        return initialState;
    }
    return state;
}

function reducerKeyEvent(state, keyCode) {
    // don't allow to move left while moving right, 
    // up while down adn etc.
    let xVel, yVel;
    switch (keyCode) {
        case 37:
            // left (if moving up/down)
            if (state.yVel !== 0) {
                xVel = -1;
                yVel = 0;
            }
            break;
        case 38:
            // up (if moving left/right)
            if (state.xVel !== 0) {
                xVel = 0;
                yVel = -1;
            }
            break;

        case 39:
            // right (if moving up/down)
            if (state.yVel !== 0) {
                xVel = 1;
                yVel = 0;
            }
            break;
        case 40:
            // down (if moving left/right)
            if (state.xVel !== 0) {
                xVel = 0;
                yVel = 1;
            }
            break;
    }

    return xVel !== undefined && yVel !== undefined ?
        Object.assign({}, state, { xVel, yVel }) : state;
}

function reduceUpdate(state, asyncDispatch) {
    // deep clone the whole state  - primitive values as well as the 'tail' array
    let newState = Object.assign({}, state);
    newState.tail = [...newState.tail];

    // update position just depending on the velocity (assuming constant 1 rate)
    newState.x += newState.xVel;
    newState.y += newState.yVel;

    if (newState.x < 0) {
        newState.x = GRID_COUNT - 1;
    }
    if (newState.x > GRID_COUNT - 1) {
        newState.x = 0;
    }
    if (newState.y < 0) {
        newState.y = GRID_COUNT - 1;
    }
    if (newState.y > GRID_COUNT - 1) {
        newState.y = 0;
    }

    // check for END - head bites itself
    let lost = newState.tail.some(t => (t.x === newState.x && t.y === newState.y));
    if (lost) {
        // send a new action from this reducer
        // this is not an ANTI-pattern if it's send as asyncDispatch
        // this is possible because of the asyncDispatchMiddleware,
        // that attaches a 'asyncDispatch' method to all handled actions
        asyncDispatch({ type: 'RESET' });
        return state;
    }


    // put the last head as first tail element
    newState.tail.unshift({ x: state.x, y: state.y });

    // remove the last
    while (newState.tailCount < newState.tail.length) {
        newState.tail.pop();
    }

    // check for apple bite
    if (newState.ax === newState.x && newState.ay === newState.y) {
        newState.tailCount += 3;

        const createApple = () => {
            newState.ax = Math.floor(Math.random() * GRID_COUNT);
            newState.ay = Math.floor(Math.random() * GRID_COUNT);

            // check if the apple is not 'created' somewhere on the snake and if so then create another
            // concat the head and tail and check over it
            let overlap = newState.tail.concat([{ x: newState.x, y: newState.y }]).
                some(t => (t.x === newState.ax && t.y === newState.ay));
            if (overlap) {
                createApple();
            }
        };
        createApple();
    }

    return newState;
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

Rx.Observable.fromEvent(document, 'keydown').
    map(event => event.keyCode).
    filter(keyCode => {
        switch (keyCode) {
            case 37:
            case 38:
            case 39:
            case 40:
                return true;
        }
        return false;
    }).
    do(() => store.dispatch({ type: 'START' })).
    map(keyCode => ({ type: 'KEY_EVENT', payload: keyCode })).
    subscribe(event => store.dispatch(event));


const interval$ = Rx.Observable.interval(FIXED_RATE).
    map(() => ({ type: 'UPDATE' }));
let gameUpdateUnsubscribe;

const store = new Store(reducer, initialState, asyncDispatchMiddleware);
store.subscribe(redraw);

store.select('isStarted').subscribe(isStarted => {
    if (isStarted) {
        gameUpdateUnsubscribe = interval$.subscribe(event => store.dispatch(event));
    } else {
        if (gameUpdateUnsubscribe)
            gameUpdateUnsubscribe.unsubscribe();
    }
});


