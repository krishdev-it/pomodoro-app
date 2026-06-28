import '@testing-library/jest-dom'
import * as React from 'react'

// React must be in scope for JSX test files that use the classic transform
globalThis.React = React

// jsdom does not implement the Notification API
globalThis.Notification = class {
  static permission = 'denied'
  static requestPermission() { return Promise.resolve('denied') }
  constructor() {}
}
