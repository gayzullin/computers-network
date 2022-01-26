import "./App.css";
import { Form, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";

function App() {
  const [formData, setFormData] = useState({});
  const [directoriesTree, setDirectoriesTree] = useState({});

  const createDirectoriesTree = (url, paths) => {
    let children = [];
    let level = { id: "root", name: `${url}/`, children };

    paths.forEach(path => {
      path
        .split("/")
        .filter(item => item)
        .reduce((r, name, i, a) => {
          if (!r[name]) {
            r[name] = { children: [] };
            r.children.push({ id: name, name, children: r[name].children });
          }

          return r[name];
        }, level);
    });
    return level;
  };

  const getPaths = (url, text) => {
    const urlRegex =
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g;
    const matches = text.match(urlRegex);
    const filtered = matches.filter(item => item.includes(url));
    const paths = filtered.map(item => {
      var url = new URL(item);
      return url.pathname;
    });
    return paths;
  };

  const sortTreeNodes = (nodeA, nodeB) => {
    if (nodeA.children.length > nodeB.children.length) {
      return -1;
    } else if (nodeA.children.length < nodeB.children.length) {
      return 1;
    } else {
      return 0;
    }
  };

  const sortTree = tree => {
    tree.children.sort(sortTreeNodes);
    for (let i = 0; i < tree.children.length; i++) {
      sortTree(tree.children[i]);
    }
  };

  const submitForm = async e => {
    e.preventDefault();
    const isDev = window.location.hostname.includes("localhost");
    const url = isDev
      ? "https://cors-anywhere.herokuapp.com/" + "https://" + formData.url
      : "https://" + formData.url;
    const result = await fetch(url, {
      mode: "cors",
      headers: {
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      }
    });
    const newHtml = await result.text();
    console.log("result", result);
    console.log("header", result.headers);

    const paths = getPaths(formData.url, newHtml);
    const directories = createDirectoriesTree(formData.url, paths);
    sortTree(directories);

    setDirectoriesTree(directories);
  };

  const handleChange = ({ target }) => {
    let name = target.name;
    let value = target.value;
    setFormData({ ...formData, [name]: value });
  };

  const renderTree = nodes => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
      {Array.isArray(nodes.children)
        ? nodes.children.map(node => renderTree(node))
        : null}
    </TreeItem>
  );

  return (
    <div className="App">
      <div className="App-header">
        <Form style={{ marginBottom: 50, marginTop: 50 }} onSubmit={submitForm}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Адрес URL</Form.Label>
            <Form.Control
              type="text"
              name="url"
              placeholder="Enter url"
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              We'll never share your email with anyone else.
            </Form.Text>
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        <div style={{ marginBottom: 30 }}>
          <div>Информация о сервере</div>
          <div></div>
        </div>
        {directoriesTree?.name && (
          <div style={{ height: 400 }}>
            <div>Дерево каталогов</div>
            <TreeView
              aria-label="rich object"
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpanded={["root"]}
              defaultExpandIcon={<ChevronRightIcon />}
              sx={{
                height: 300,
                flexGrow: 1,
                maxWidth: 400,
                overflowY: "auto"
              }}
            >
              {renderTree(directoriesTree)}
            </TreeView>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
