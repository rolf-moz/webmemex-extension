import React from 'react'
import PropTypes from 'prop-types'
import { Button, Icon } from 'semantic-ui-react'

import { downloadPage } from 'src/local-storage'

const SaveAsButton = ({ page, label = false }) => (
    <Button
        icon
        size='tiny'
        onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            downloadPage({ page, saveAs: true })
        }}
        title='Save snapshot as…'
    >
        <Icon name='download' />
        {label && ' Save as…'}
    </Button>
)

SaveAsButton.propTypes = {
    page: PropTypes.object.isRequired,
    label: PropTypes.bool,
}

export default SaveAsButton
