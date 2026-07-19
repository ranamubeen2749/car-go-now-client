import WorkspaceLayout from "../../components/WorkspaceLayout";
import { ownerMenuLinks } from "../../assets/assets";

const Layout = () => {
    return <WorkspaceLayout label="Owner workspace" menuLinks={ownerMenuLinks} />;
};

export default Layout;
