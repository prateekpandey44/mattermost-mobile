// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import FastImage from 'react-native-fast-image';

import CustomPropTypes from 'app/constants/custom_prop_types';

export default class Emoji extends React.PureComponent {
    static propTypes = {

        /*
         * Emoji text name.
         */
        emojiName: PropTypes.string.isRequired,

        /*
         * Image URL for the emoji.
         */
        imageUrl: PropTypes.string.isRequired,

        /*
         * Set if this is a custom emoji.
         */
        isCustomEmoji: PropTypes.bool.isRequired,

        /*
         * Set to render only the text and no image.
         */
        displayTextOnly: PropTypes.bool,
        literal: PropTypes.string,
        size: PropTypes.number.isRequired,
        textStyle: CustomPropTypes.Style,
        token: PropTypes.string.isRequired
    };

    static defaultProps = {
        customEmojis: new Map(),
        literal: '',
        imageUrl: '',
        isCustomEmoji: false
    };

    constructor(props) {
        super(props);

        this.state = {
            originalWidth: 0,
            originalHeight: 0
        };
    }

    componentWillMount() {
        this.mounted = true;
        if (!this.props.displayTextOnly && this.props.imageUrl && this.props.isCustomEmoji) {
            this.updateImageHeight(this.props.imageUrl);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.emojiName !== this.props.emojiName) {
            this.setState({
                originalWidth: 0,
                originalHeight: 0
            });
        }

        if (!nextProps.displayTextOnly && nextProps.imageUrl && nextProps.isCustomEmoji &&
                nextProps.imageUrl !== this.props.imageUrl) {
            this.updateImageHeight(nextProps.imageUrl);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    updateImageHeight = (imageUrl) => {
        Image.getSize(imageUrl, (originalWidth, originalHeight) => {
            if (this.mounted) {
                this.setState({
                    originalWidth,
                    originalHeight
                });
            }
        });
    }

    render() {
        const {
            literal,
            size,
            textStyle,
            token,
            imageUrl,
            displayTextOnly
        } = this.props;

        if (displayTextOnly) {
            return <Text style={textStyle}>{literal}</Text>;
        }

        const source = {
            uri: imageUrl,
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        let width = size;
        let height = size;
        if (this.state.originalHeight && this.state.originalWidth) {
            if (this.state.originalWidth > this.state.originalHeight) {
                height = (size * this.state.originalHeight) / this.state.originalWidth;
            } else if (this.state.originalWidth < this.state.originalHeight) {
                // This may cause text to reflow, but its impossible to add a horizontal margin
                width = (size * this.state.originalWidth) / this.state.originalHeight;
            }
        }

        let marginTop = 0;
        if (textStyle) {
            const fontSize = StyleSheet.flatten(textStyle).fontSize;

            // Center the image vertically on iOS (does nothing on Android)
            marginTop = (height - 16) / 2;

            // hack to get the vertical alignment looking better
            if (fontSize === 17) {
                marginTop -= 2;
            } else if (fontSize === 15) {
                marginTop += 1;
            }
        }

        // Android can't change the size of an image after its first render, so
        // force a new image to be rendered when the size changes
        const key = Platform.OS === 'android' ? (height + '-' + width) : null;

        if (!imageUrl) {
            return (
                <View
                    key={key}
                    style={{width, height, marginTop}}
                />
            );
        }

        let ImageComponent;
        if (Platform.OS === 'android') {
            ImageComponent = Image;
        } else {
            ImageComponent = FastImage;
        }

        return (
            <ImageComponent
                key={key}
                style={{width, height, marginTop}}
                source={source}
                onError={this.onError}
            />
        );
    }
}
