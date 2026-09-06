import networkx as nx
from typing import List, Dict, Tuple
from backend.models.models import Road, Node

HOSPITAL_ROADS = {"R6", "R16"}  # Roads leading to GKNM Hospital

class CityGraph:
    def __init__(self):
        self.G = nx.DiGraph()
        self._closed_roads: set = set()

    def build(self, roads: List[Road], nodes: List[Node]):
        self.G.clear()
        self._closed_roads = set()
        for node in nodes:
            self.G.add_node(
                node.id, name=node.name, lat=node.lat,
                lon=node.lon, population=node.population, node_type=node.node_type
            )
        for road in roads:
            if road.status == "open":
                utilization = road.traffic_volume / max(road.capacity, 1)
                # Travel time weight: length/speed penalized by congestion
                weight = (road.length / max(road.avg_speed, 1)) * (1 + utilization * 1.5)
                attrs = dict(
                    road_id=road.id, name=road.name,
                    capacity=road.capacity, traffic_volume=road.traffic_volume,
                    avg_speed=road.avg_speed, length=road.length,
                    utilization=utilization, weight=weight,
                    is_hospital_road=(road.id in HOSPITAL_ROADS)
                )
                self.G.add_edge(road.source_node, road.dest_node, **attrs)
                self.G.add_edge(road.dest_node, road.source_node, **{**attrs, "road_id": road.id + "_r"})

    def close_road(self, road_id: str):
        edges_to_remove = [
            (u, v) for u, v, d in self.G.edges(data=True)
            if d.get("road_id") in (road_id, road_id + "_r")
        ]
        self.G.remove_edges_from(edges_to_remove)
        self._closed_roads.add(road_id)

    def get_alternate_paths(self, source: str, target: str, k: int = 3) -> List[List[str]]:
        try:
            paths = list(nx.shortest_simple_paths(self.G, source, target, weight="weight"))
            return paths[:k]
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def redistribute_traffic(self, closed_road_id: str, roads: List[Road]) -> Dict[str, float]:
        closed = next((r for r in roads if r.id == closed_road_id), None)
        if not closed:
            return {}
        diverted_volume = closed.traffic_volume
        paths = self.get_alternate_paths(closed.source_node, closed.dest_node)
        if not paths:
            return {}
        increases: Dict[str, float] = {}
        per_path = diverted_volume / len(paths)
        for path in paths:
            for i in range(len(path) - 1):
                edge = self.G.get_edge_data(path[i], path[i + 1])
                if edge:
                    rid = edge.get("road_id", "")
                    if not rid.endswith("_r"):
                        cap = edge.get("capacity", 1000)
                        increases[rid] = increases.get(rid, 0) + (per_path / max(cap, 1) * 100)
        return increases

    def get_network_stats(self) -> dict:
        if not self.G.edges():
            return {"avg_utilization": 0, "max_utilization": 0, "congested_roads": 0}
        utils = [d.get("utilization", 0) for _, _, d in self.G.edges(data=True)
                 if not d.get("road_id", "").endswith("_r")]
        return {
            "avg_utilization": round(sum(utils) / len(utils) * 100, 1) if utils else 0,
            "max_utilization": round(max(utils) * 100, 1) if utils else 0,
            "congested_roads": sum(1 for u in utils if u > 0.7),
            "total_edges": len(utils),
            "is_connected": nx.is_weakly_connected(self.G) if self.G.nodes() else False
        }

    def get_emergency_accessibility(self, hospital_node: str = "N6") -> dict:
        accessible_from = []
        blocked_from = []
        for node in self.G.nodes():
            if node == hospital_node:
                continue
            try:
                path = nx.shortest_path(self.G, node, hospital_node, weight="weight")
                accessible_from.append(node)
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                blocked_from.append(node)
        total = len(list(self.G.nodes())) - 1
        score = (len(accessible_from) / max(total, 1)) * 100
        return {
            "score": round(score, 1),
            "accessible_nodes": len(accessible_from),
            "blocked_nodes": len(blocked_from),
            "hospital_node": hospital_node
        }

    def get_road_utilizations(self) -> Dict[str, float]:
        return {
            d["road_id"]: d.get("utilization", 0)
            for _, _, d in self.G.edges(data=True)
            if not d.get("road_id", "").endswith("_r")
        }
