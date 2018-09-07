import * as PropTypes from 'prop-types'

export const ActionShape = PropTypes.shape({
    run: PropTypes.func.isRequired,
    error: PropTypes.object,
    response: PropTypes.any,
    isLoading: PropTypes.bool,
})
