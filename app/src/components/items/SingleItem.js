import React, { Component } from 'react';

class SingleItem extends Component {
    render() {
        return (
            <tr>
                <td>#123</td>
                <td>Nike Hoodie</td>
                <td>Plain gray hoodie in medium size.</td>
                <td>Nike</td>
                <td>Eth 0.01</td>
                <td>Manufactured</td>
                <td><button>Pack</button></td>
            </tr>
        );
    }
}

export default SingleItem
