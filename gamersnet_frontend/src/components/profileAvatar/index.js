import React from 'react';
import APIFetch from '../../utilities/api';

export default class ProfileAvatar extends React.Component {
    constructor(props) {
        super(props);

        this.state = {avatar: undefined};
    }

    componentDidMount() {
        let fetchData = APIFetch('/users/getAvatar/' + this.props.userID);

        fetchData.then(async (data) => {
            if (await data.ok) {
                let image = await data.blob();
                
                this.setState({avatar: URL.createObjectURL(image)});
            } else {
                console.log('profile-avatar', 'network problem happened');
            }
        });
    }
    
    render() {
        return (
            <img src = {this.state.avatar} />
        );
    }
}