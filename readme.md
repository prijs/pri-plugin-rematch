# pri-plugin-rematch &middot; [![npm version](https://img.shields.io/npm/v/pri-plugin-rematch.svg?style=flat-square)](https://www.npmjs.com/package/pri-plugin-rematch)

[rematch](https://github.com/rematch/rematch) is a nice framework for redux.

We provide `pri-plugin-rematch` to use it more easy!

## Usage

```bash
npm i pri-plugin-rematch
```

```
.
├── src
│    └── models
│          ├── application.ts      # model file
│          └── user.ts             # model file
└── priconfig.json
```

Let’s try it! For example, create a model named `user`:

**src/models/user.ts**

```typescript
import { model } from 'pri/model';

export default model({
  state: {
    name: 'jeck',
    age: 25
  },
  reducers: {
    increment: (state, count = 1) => {
      return {
        ...state,
        age: state.age + count
      };
    }
  },
  effects: {
    async asyncIncrement() {
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
      this.increment(5);
    }
  }
});
```

Then, use it in pages!

**src/pages/index.tsx**

```typescript
import { connect } from 'pri/models';

@connect(
  state => {
    return {
      age: state.user.age
    };
  },
  dispatch => {
    return { increment: dispatch.user.increment, asyncIncrement: dispatch.user.asyncIncrement };
  }
)
export default class Page extends React.PureComponent<Props, State> {
  /**/
}
```

> Import connect from 'pri/models' is a better way, 'pri/models' provides a strong typed `connect` function:

<img src="https://user-images.githubusercontent.com/7970947/39965212-62615908-56c7-11e8-9084-081734eaf280.png" width={400} />
