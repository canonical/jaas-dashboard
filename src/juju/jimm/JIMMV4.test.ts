import type { ConnectionInfo, Transport } from "@canonical/jujulib";

import { connectionInfoFactory } from "testing/factories/juju/jujulib";

import JIMMV4 from "./JIMMV4";

describe("JIMMV4", () => {
  let transport: Transport;
  let connectionInfo: ConnectionInfo;

  beforeEach(() => {
    transport = {
      write: jest.fn(),
    } as unknown as Transport;
    connectionInfo = connectionInfoFactory.build();
  });

  it("findAuditEvents", async () => {
    const jimm = new JIMMV4(transport, connectionInfo);
    jimm.findAuditEvents({ "user-tag": "user-eggman@external" });
    expect(transport.write).toHaveBeenCalledWith(
      {
        type: "JIMM",
        request: "FindAuditEvents",
        version: 3,
        params: { "user-tag": "user-eggman@external" },
      },
      expect.any(Function),
      expect.any(Function)
    );
  });
});
