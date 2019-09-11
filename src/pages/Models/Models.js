import React from "react";

import Layout from "components/Layout/Layout";
import TableList from "components/TableList/TableList";

export default function Models() {
  return (
    <Layout sidebar>
      <div className="p-strip">
        <div className="row">
          <h2>Models</h2>
          <TableList />
        </div>
      </div>
    </Layout>
  );
}
