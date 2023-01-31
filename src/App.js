import "./app.css";
import Layout from "./components/Layout/Layout";

import 'regenerator-runtime/runtime'

function App(props) {
  const {nftContract, marketplaceContract, accountId, nearConfig, wallet } = props;
  
  const signIn = () => {
    wallet.requestSignIn(
      nearConfig.nftContract
    );
  };

  const signOut = () => {
    wallet.signOut();
    sessionStorage.clear()
    window.location.replace(window.location.origin + window.location.pathname);
  };

  const mainObject = {nftContract, marketplaceContract, accountId, nearConfig, wallet, signIn, signOut};

  return(
    <Layout mainObject={mainObject}/>
  );
}

export default App;