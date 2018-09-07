import { shallow } from 'enzyme'
import * as React from 'react'

import { onChange } from './onChange'

describe('onChange', () => {
  it('Runs callback on mount and on prop change', () => {
    interface Props {
      id: number
    }
    const Component: React.SFC<Props> = (props) => <div>{props.id}</div>
    const mockCallback = jest.fn()
    const WrappedComponent = onChange<Props>(['id'], mockCallback)(Component)

    const wrapper = shallow(<WrappedComponent id={1} />)
    expect(mockCallback).lastCalledWith({ id: 1 })
    wrapper.setProps({ id: 2 })
    expect(mockCallback).lastCalledWith({ id: 2 })
  })
})
