/* global Rx */

// action
// export interface Action {
//     type: string;
//     payload?: any;
// }

// reducer
// export interface Reducer<T> {
//     (state: T, action: Action): T;
// }

export default class Store extends Rx.BehaviorSubject {

    constructor(reducer, initialState) {
        super(initialState);

        this._reducer = reducer;
        this._dispatcher = new Rx.Subject();
        this._dispatcher.
            scan((state, action) => this._reducer(state, action), initialState).
            subscribe((state) => super.next(state));
    }

    getState() {
        return this.value;
    }

    dispatch(action) {
        this._dispatcher.next(action);
    }
}