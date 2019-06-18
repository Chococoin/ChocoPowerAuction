import React from 'react';
import styled from 'styled-components';

const StyledFrame = styled.nav`
  width: 100vw;
  height: 39vh;
  background: #EFE7D6; 
`
const Img = styled.img`
  width: 100vw;
  height: 39vh;
  background-image: url(https://i.ibb.co/XVZGN04/Choco-Header.png);
  background-repeat: no-repeat;
  background-position: center top;
`

class Navbar extends React.Component {
    render() {
        return (
            <StyledFrame>
                <Img />
            </StyledFrame>
        )
      }
}

export default Navbar
