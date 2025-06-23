import React, { MouseEvent, useEffect, useRef, useMemo } from "react";

import {
  HierarchyNode,
  Arc,
  select,
  hierarchy,
  partition,
  arc,
  quantize,
  interpolateRainbow,
} from "d3";

import { scaleOrdinal } from "d3-scale";

import { Stack, useTheme, Box } from "@mui/material";

import "./Chart.css";

import type { Tree, Node } from "./Types";
import { DisplayPath, getPath, sizeToText as defaultSizeToText } from "./Utils";

interface SunburstProps {
  /** Formatted data to be displayed in the chart */
  tree: Tree;
  /** Boolean indicating if there are hidden levels */
  hasHiddenLevels?: boolean;
  /** Function to convert the size to text */
  sizeToText?: (size: number) => string;
  /** The current path in the data tree */
  currentPath?: string[];
  /** Callback function to remove a quarter from the chart */
  handleRightClick?: (p: Node) => void;
  /** Function to update the current path */
  setCurrentPath?: React.Dispatch<React.SetStateAction<string[]>>;
  /**  Function to generate color scales for the chart */
  colorScales?: (name: string, size: number, depth: number) => string;
}

/**
 * Create the Sunburst component.
 * Adapted from https://observablehq.com/@d3/zoomable-sunburst
 *
 * @param props The props for the Sunburst. See SunburtProps for details
 * @see {@link SunburstProps}
 * @returns The Sunurst component
 */
export function Sunburst({
  tree,
  hasHiddenLevels = true,
  sizeToText = defaultSizeToText,
  currentPath,
  handleRightClick,
  setCurrentPath,
  colorScales,
}: SunburstProps) {
  // Create a stable default color scale with useMemo
  const defaultColorScale = useMemo(() => {
    if (!tree?.children) return () => "#ccc";

    const colorScale = scaleOrdinal(
      quantize(interpolateRainbow, tree.children.length + 1),
    );
    return (name: string, _size: number, _depth: number) => colorScale(name);
  }, [tree?.children?.length]);

  // Use the provided colorScales or the default one
  const finalColorScales = colorScales || defaultColorScale;

  const svgRef = useRef(null);
  const tooltipRef: React.RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Dimensions are for the ViewBox (in px)
  const width = 800;
  const height = 800;

  useEffect(() => {
    const radius: number = width / 7;

    // Compute the layout.
    const hierarchyStruct = hierarchy(tree) // Create the tree
      .sum((d) => d.value || 0)
      .sort((a: HierarchyNode<Tree>, b: HierarchyNode<Tree>) => {
        if (a.value && b.value) return b.value - a.value;
        if (a.value) return -1;
        if (b.value) return 1;
        return 0;
      });

    const root: Node = partition<Tree>().size([
      2 * Math.PI,
      hierarchyStruct.height + 1,
    ])(hierarchyStruct);
    root.each((d) => {
      d.current = d;
    });

    // Create the arc generator.
    const arcGenerator: Arc<void, Node> = arc<Node>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Create the SVG container.
    const svg = select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, width])
      .style("font", "10px sans-serif");

    tooltipRef.current!.innerHTML = ""; // Delete the previous tooltip

    // Create the tooltip
    const tooltip = select(tooltipRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .text("");

    // Remove any previous elements
    svg.selectAll("*").remove();

    // Cercle in the middle of the  Sunburst
    svg
      .append("circle")
      .datum(root)
      .attr("r", radius)
      .style("cursor", "pointer")
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", unZoom);

    // Append the arcs.
    const path = svg
      .append("g")
      .selectAll<SVGPathElement, Node>("path")
      .data(root.descendants().slice(1))
      .join("path")
      .attr("fill", (d) => {
        while (d.depth > 1) d = d.parent!;
        return finalColorScales(d.data.name, d.x1 - d.x0, d.depth);
      })
      .attr("fill-opacity", (d) =>
        arcVisible(d.current!)
          ? d.children || hasHiddenLevels
            ? 0.8
            : 0.4
          : 0,
      )
      .attr("pointer-events", (d) => (arcVisible(d.current!) ? "auto" : "none"))
      .attr("d", (d) => arcGenerator(d.current!));

    function zoom(_event: MouseEvent, p: Node) {
      if (setCurrentPath && currentPath)
        setCurrentPath(currentPath.concat(getPath(p)));
    }

    function unZoom(_event: MouseEvent, _p: Node) {
      if (setCurrentPath && currentPath)
        setCurrentPath(currentPath.slice(0, -1));
    }

    if (setCurrentPath) {
      // If the chart can be modified
      // Make them clickable if they have children.
      path
        .filter((d: Node) => Array.isArray(d.children) || hasHiddenLevels)
        .style("cursor", "pointer")
        .on("click", zoom);
    }

    // Make them interact with the mouse
    path
      .on(
        "mouseover",
        function (this: SVGPathElement, event: MouseEvent, p: Node) {
          mouseOn.call(this, event, p);
        },
      )
      .on(
        "mouseout",
        function (this: SVGPathElement, event: MouseEvent, p: Node) {
          mouseOut.call(this, event, p);
        },
      )
      .on("mousemove", mouseMove)
      .on("contextmenu", rightClicked);

    // Text on the chart quarters
    svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d) => +labelVisible(d.current!))
      .attr("transform", (d) => labelTransform(d.current!))
      .attr("fill", theme.palette.text.primary)
      .text((d) => d.data.name);

    // Text with the size in the middle (multi-line support)
    const centerText = sizeToText(root.value || 0);
    const lines = centerText.split("\n");

    const textGroup = svg
      .append("g")
      .attr("text-anchor", "middle")
      .attr("fill", theme.palette.text.primary);

    lines.forEach((line, index) => {
      textGroup
        .append("text")
        .attr("x", 0)
        .attr("y", (index - (lines.length - 1) / 2) * 35)
        .attr("dominant-baseline", "middle")
        .attr("font-size", "30px")
        .text(line);
    });

    function arcVisible(d: Node): boolean {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d: Node): boolean {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    // Move the label to the right place
    function labelTransform(d: Node): string {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    function mouseOn(this: SVGPathElement | null, event: MouseEvent, p: Node) {
      if (p.children && setCurrentPath) {
        select(this).transition().duration(30).attr("opacity", "0.85");
      }
      tooltip.style("visibility", "visible");
      tooltip
        .style("top", event.pageY - 50 + "px")
        .style("left", event.pageX - 50 + "px");
      tooltip.text(
        (currentPath || []).concat(getPath(p)).join("/") +
          ": " +
          sizeToText(p.value || 0),
      );
    }

    function mouseOut(this: SVGPathElement, _event: MouseEvent, _p: Node) {
      select(this).transition().duration(30).attr("opacity", "1");
      tooltip.style("visibility", "hidden");
    }

    function mouseMove(event: MouseEvent, _p: Node) {
      tooltip
        .style("top", event.pageY - 50 + "px")
        .style("left", event.pageX - 50 + "px");
    }

    function rightClicked(event: MouseEvent, p: Node) {
      event.preventDefault();
      if (handleRightClick) handleRightClick(p);
      tooltip.style("visibility", "hidden");
    }
  }, [
    width,
    height,
    tree,
    handleRightClick,
    currentPath,
    setCurrentPath,
    theme,
    finalColorScales,
    sizeToText,
  ]);

  return (
    <Stack sx={{ height: 1, width: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {currentPath && setCurrentPath && (
          <DisplayPath path={currentPath} setPath={setCurrentPath} />
        )}
      </Box>
      <div
        style={{
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <svg ref={svgRef} width={"100%"} height={"100%"} />
      </div>
      <div ref={tooltipRef} />
    </Stack>
  );
}
