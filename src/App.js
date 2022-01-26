import "./App.css";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";

function App() {
  const [formData, setFormData] = useState({
    protcol: "http",
    host: "",
    port: "80",
    cors: false
  });
  const [serverInfo, setServerInfo] = useState(null);
  const [directoriesTree, setDirectoriesTree] = useState({});
  const [serverError, setServerError] = useState("");

  const createDirectoriesTree = (url, paths) => {
    let children = [];
    let level = { id: "root", name: `${url}`, children };

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

  const getPaths = (host, text) => {
    const urlRegex =
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g;
    const matches = text.match(urlRegex);
    const filtered = matches.filter(item => item.includes(host));
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
    setServerError("");

    const link = `${formData.protcol}://${formData.host}:${formData.port}`;
    const url = formData.cors
      ? "https://cors-anywhere.herokuapp.com/" + link
      : link;
    try {
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
      const headers = [...result.headers];
      const headersObject = headers.reduce(
        (res, item) => ({ ...res, [item[0]]: item[1] }),
        {}
      );
      const finalHost = headersObject["x-final-url"] || formData.host;
      setServerInfo(headers);

      const paths = getPaths(finalHost, newHtml);
      const directories = createDirectoriesTree(finalHost, paths);
      sortTree(directories);

      setDirectoriesTree(directories);
    } catch (e) {
      setServerError(e.message);
    }
  };

  const handleChange = ({ target }) => {
    let name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
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
          <Form.Group style={{ textAlign: "center" }} className="mb-3">
            <Form.Label>Адрес URL</Form.Label>
            <Row>
              <Col>
                <Form.Control
                  type="text"
                  name="protocol"
                  placeholder="Enter protocol"
                  defaultValue="http"
                  required
                  onChange={handleChange}
                />
              </Col>
              ://
              <Col>
                <Form.Control
                  type="text"
                  name="host"
                  placeholder="Enter host"
                  required
                  onChange={handleChange}
                />
              </Col>
              :
              <Col>
                <Form.Control
                  type="text"
                  name="port"
                  placeholder="Enter port"
                  defaultValue="80"
                  required
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              style={{ flexDirection: "row", fontSize: 16 }}
              type="checkbox"
              name="cors"
              label="Использовать CORS прокси"
              onChange={handleChange}
            />
            {formData.cors && (
              <div style={{ fontSize: 16 }}>
                <div>Сначала нужно подтвердить по ссылке:</div>
                <a href="https://cors-anywhere.herokuapp.com/">
                  https://cors-anywhere.herokuapp.com/
                </a>
              </div>
            )}
          </Form.Group>
          <Row style={{ textAlign: "center" }}>
            <Col>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Col>
          </Row>
        </Form>
        {serverError && <div>Ошибка: {serverError}</div>}
        {serverInfo !== null && (
          <div style={{ marginBottom: 30, textAlign: "center" }}>
            <div>Информация о сервере</div>
            <div style={{ fontSize: 14 }}>
              {serverInfo
                ? serverInfo.map((item, index) => (
                    <div key={index}>
                      {item[0]}: {item[1]}
                    </div>
                  ))
                : "Не найдено"}
            </div>
          </div>
        )}
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
