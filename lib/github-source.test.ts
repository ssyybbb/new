import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeGithubOrg,
  normalizeGithubRepo,
  parseGithubSource,
  parseRepoList,
} from "./github-source";

describe("parseGithubSource", () => {
  it("keeps a plain organization name", () => {
    assert.deepEqual(parseGithubSource("PhyAgentOS"), { org: "PhyAgentOS" });
  });

  it("keeps owner/repo", () => {
    assert.deepEqual(parseGithubSource("PhyAgentOS/PhyAgentOS-core"), {
      org: "PhyAgentOS",
      repo: "PhyAgentOS/PhyAgentOS-core",
    });
  });

  it("strips a pulls page URL down to the repository", () => {
    assert.deepEqual(
      parseGithubSource("https://github.com/PhyAgentOS/PhyAgentOS-core/pulls"),
      { org: "PhyAgentOS", repo: "PhyAgentOS/PhyAgentOS-core" },
    );
  });

  it("strips query strings and .git suffix", () => {
    assert.equal(
      normalizeGithubRepo(
        "https://github.com/PhyAgentOS/PhyAgentOS-core.git?tab=readme",
      ),
      "PhyAgentOS/PhyAgentOS-core",
    );
  });

  it("reads an organization from its GitHub homepage", () => {
    assert.equal(normalizeGithubOrg("https://github.com/PhyAgentOS"), "PhyAgentOS");
  });
});

describe("parseRepoList", () => {
  it("accepts mixed names and URLs", () => {
    assert.deepEqual(
      parseRepoList(
        "PhyAgentOS/PhyAgentOS-core https://github.com/PhyAgentOS/PhyAgentOS-core/pulls",
      ),
      ["PhyAgentOS/PhyAgentOS-core"],
    );
  });
});
