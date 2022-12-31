import React from 'react'
import PropTypes from 'prop-types'

import syncLocationHashes from 'src/util/sync-location-hashes'


function fixChromiumInjectedStylesheet(document) {
    // Pragmatic workaround for Chromium, which appears to inject two style
    // rules into extension pages (with font-size: 75%, for some reason?).
    const styleEl = document.createElement('style')
    styleEl.innerHTML = `body {
        font-size: inherit;
        font-family: inherit;
    }`
    document.head.insertAdjacentElement('afterbegin', styleEl)
}

const leafNodeTags = ["a", "strong", "b", "span", "br", "script"]
const leafNodeTypes = [Node.TEXT_NODE, Node.CDATA_SECTION_NODE, Node.COMMENT_NODE]

export default class ContentFrame extends React.Component {
    getElementRect(el) {
        const rect = el.getBoundingClientRect()
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height,
        }
    }

    onIframeLoaded() {
        const iframe = this.iframeEl
        const doc = iframe.contentDocument

        // Ensure a head element exists.
        if (!doc.head) {
            const head = doc.createElement('head')
            doc.documentElement.insertAdjacentElement('afterbegin', head)
        }

        // Make links open in the whole tab, not inside the iframe
        const baseEl = doc.createElement('base')
        baseEl.setAttribute('target', '_parent')
        doc.head.insertAdjacentElement('afterbegin', baseEl)

        // Workaround required for Chromium.
        fixChromiumInjectedStylesheet(doc)

        // Focus on the page so it receives e.g. keyboard input
        iframe.contentWindow.focus()

        // Keep the iframe's location #hash in sync with that of the window.
        syncLocationHashes([window, iframe.contentWindow], { initial: window })

        this.leafNodeTagSet = new Set(leafNodeTags)
        this.leafNodeTypeSet = new Set(leafNodeTypes)
        this.leafElements = []
        this.recurseTree(doc.documentElement)

        for (const element of this.leafElements) {
            element.style.border = "1px solid #ff00ff"
            element.style.borderStyle = "dashed"
        }
        //            'y_from_bottom': leaf['nodeViewport']['from_bottom'],
        //                 leafXpath: leaf.leafXpath,
        //                 parentXpath: leaf.nodeXpath,
        const leafInfo = this.leafElements.map((leaf) => {
            const elRect = this.getElementRect(leaf)
            const text = leaf.innerText.replace(/\s\s+/g, ' ');
            return {
                x: elRect.left,
                y: elRect.top,
                width: elRect.width,
                height: elRect.height,
                font_size: leaf['font-size'],
                tag_name: leaf.tagName,
                class_names: leaf.className,
                id: leaf.id,
                text: text,
                num_of_words: text.split(' ').length
            }
        }).filter(a => (a.width > 0 && a.height > 0))
        console.log(JSON.stringify(leafInfo))
    }

    exportData() {

    }

    recurseTree(n) {
        console.log("traversing tree")
        let hasStructureElements = false
        for (let i = 0; i < n.childNodes.length; i++) {
            const newNode = n.childNodes[i]
            if (this.leafNodeTypeSet.has(newNode.nodeType) || this.leafNodeTagSet.has(newNode.tagName.toLowerCase())) {
                continue
            }
            hasStructureElements = true
            if (newNode.childNodes.length === 0) {
                this.leafElements.push(newNode)
            } else {
                const hasStructure = this.recurseTree(newNode)
                console.log("has structure for " + newNode.tagName + " " + hasStructure)
                if (!hasStructure) {
                    this.leafElements.push(newNode)
                }
            }
        }
        return hasStructureElements
    }

    render() {
        return (
            <iframe
                id='page'
                ref={el => { this.iframeEl = el }}
                sandbox='allow-same-origin allow-top-navigation allow-scripts'
                seamless
                srcDoc={this.props.html}
                // XXX The DOMContentLoaded event would be better, but how to listen to that?
                onLoad={() => this.onIframeLoaded()}
            />
        )
    }
}

ContentFrame.propTypes = {
    html: PropTypes.string.isRequired,
}
