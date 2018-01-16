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

export class Store extends Rx.BehaviorSubject {


    constructor(reducer, initialState, ...middlewares) {
        super(initialState);

        this._reducer = reducer;

        this._listMiddleware = [];
        this._listMiddleware.push(...middlewares);

        this._dispatcher = new Rx.Subject();
        this._dispatcher.
            scan((state, action) => {
                return this._reducer(state, action)
            }, initialState).
            distinctUntilChanged().
            subscribe((state) => {
                super.next(state);
            });
    }

    getState() {
        return this.value;
    }

    dispatch(action) {
        const middlewares = this._listMiddleware.slice();
        middlewares.reverse();

        let next = this._dispatcher.next.bind(this._dispatcher);
        middlewares.forEach(middleware =>
            next = middleware(next)
        );

        next(action);
    }

    select(...paths) {
        return this.pluck(paths).distinctUntilChanged();
    }

    addMiddleware(middleware) {
        this._listMiddleware.push(middleware(this));
    }
}

export function select(store, ...paths) {
    return store.pluck(paths).distinctUntilChanged();
}

export const asyncDispatchMiddleware = (store) => {
    return (next) => {
        return (action) => {
            let syncActivityFinished = false;
            let actionQueue = [];

            function flushQueue() {
                actionQueue.forEach(a => store.dispatch(a)); // flush queue
                actionQueue = [];
            }

            function asyncDispatch(asyncAction) {
                actionQueue = actionQueue.concat([asyncAction]);

                if (syncActivityFinished) {
                    flushQueue();
                }
            }

            const actionWithAsyncDispatch =
                Object.assign({}, action, { asyncDispatch });

            next(actionWithAsyncDispatch);
            syncActivityFinished = true;
            flushQueue();

        };
    };

};