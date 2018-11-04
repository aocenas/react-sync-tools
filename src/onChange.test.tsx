import { shallow } from 'enzyme'
import * as React from 'react'

import { onChange } from './onChange'

describe('onChange', () => {
  it('Runs callback on mount and on prop change', () => {
    const Component = (props: any) => <div>{props.id}</div>
    const mockCallback = jest.fn()
    const WrappedComponent = onChange(['id'], mockCallback)(Component)

    const wrapper = shallow(<WrappedComponent id={1} />)
    expect(mockCallback).lastCalledWith({ id: 1 })
    wrapper.setProps({ id: 2 })
    expect(mockCallback).lastCalledWith({ id: 2 })

    // This should not trigger the callback
    wrapper.setProps({ id: 2 })
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })
})
