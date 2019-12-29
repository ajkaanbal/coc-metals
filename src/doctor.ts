import { HTMLElement, Node } from "node-html-parser";
import { workspace } from "coc.nvim";
import { Commands } from "./commands";

const padText = (text: string | Node, index: number): string => {
  let neededPadding: number;
  if (typeof text === "string" && index === 0) {
    neededPadding = 22 - text.length;
  } else if (typeof text === "string") {
    neededPadding = 18 - text.length;
  } else if ((text.rawText.match(/&/g) || []).length > 1) {
    neededPadding = 16;
  } else {
    neededPadding = 15;
  }
  const neededPre = Math.round(neededPadding / 2);

  const preSpacing = neededPre > 0 ? " ".repeat(neededPre) : " ";
  const postSpacing =
    neededPre > 0 ? " ".repeat(neededPadding - neededPre) : " ";
  return `${preSpacing}${text.toString().replace("\n", " ")}${postSpacing}`;
};

const getRowText = (row: Node): string[] =>
  row.childNodes.map((node, index) => {
    if (node.rawText.startsWith("&")) {
      return padText(node.childNodes[0], index);
    } else {
      return padText(node.rawText, index);
    }
  });

// This beautiful html parse hack to display Doctor is not ideal,
// but currently Metals only returns HTML. So when that changes
// and we can handle JSON or markdown instead, we'll throw away
// all of this garbage.
export function makeVimDoctor(root): void {
  if (!root) {
    workspace.showMessage("Unable to run Doctor", "error");
    return;
  }

  const doctorTitle: string = root.querySelector("h1").rawText;
  const notes: HTMLElement[] = root.querySelectorAll("p");
  const table: HTMLElement = root.querySelector("table");

  if (table) {
    const tableHeading: string = table
      .querySelector("thead")
      .childNodes[0].childNodes.map((node: Node, index: number) =>
        padText(node.rawText, index)
      )
      .join(" | ");

    const tableBody: string[] = table
      .querySelector("tbody")
      .childNodes.map(getRowText)
      .map((row: string[]) => row.join(" | "));

    const doctor: string[] = [
      doctorTitle,
      "-------------",
      notes[0].rawText,
      "",
      tableHeading,
      "-".repeat(144),
      ...tableBody,
      ""
    ];

    workspace.nvim.call(
      Commands.OPEN_PREVIEW,
      [doctor, "txt", "setl nonumber", "setl nowrap"],
      true
    );
  } else {
    const errors: Node[] = notes[1].childNodes;
    const errorMessage: String = errors[0].toString();
    const errorList: string[] = errors[1].childNodes.map(
      (node: Node) => `  - ${node.rawText}`
    );

    const doctor: String[] = [
      doctorTitle,
      "-------------",
      errorMessage,
      "",
      ...errorList,
      ""
    ];

    workspace.nvim.call(
      Commands.OPEN_PREVIEW,
      [doctor, "txt", "setl nonumber", "setl nowrap"],
      true
    );
  }
}