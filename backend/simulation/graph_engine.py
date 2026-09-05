import networkx as nx
from typing import List, Dict, Optional
from backend.models.models import Road, Node

class CityGraph:
    def __init__(self):
        self.G = nx.DiGraph()

    def build(self, roads: List[Road], nodes: List[Node]):
        self.G.clear()
        for node in nodes:
            self.G.add_node(node.id, name=node.name, lat=node.lat, lon=node.lon, population=node.population)
        for road in roads:
            if road.status == "open":
                utilization = road.traffic_volume / max(road.capacity, 1)
                weight = road.length / max(road.avg_speed, 1) * (1 + utilization)
                self.G.add_edge(
                    road.source_node, road.dest_node,
                    road_id=road.id, name=road.name,
                    capacity=road.capacity, traffic_volume=road.traffic_volume,
                    avg_speed=road.avg_speed, length=road.length,
                    utilization=utilization, weight=weight
                )
                self.G.add_edge(
                    road.dest_node, road.source_node,
                    road_id=road.id + "_r", name=road.name,
                    capacity=road.capacity, traffic_volume=road.traffic_volume,
                    avg_speed=road.avg_speed, length=road.length,
                    utilization=utilization, weight=weight
                )

    def close_road(self, road_id: str):
        edges_to_remove = [
            (u, v) for u, v, d in self.G.edges(data=True)
            if d.get("road_id") in (road_id, road_id + "_r")
        ]
        self.G.remove_edges_from(edges_to_remove)

    def get_alternate_paths(self, source: str, target: str, k: int = 3) -> List:
        try:
            paths = list(nx.shortest_simple_paths(self.G, source, target, weight="weight"))
            return paths[:k]
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def calculate_network_congestion(self) -> float:
        if not self.G.edges():
            return 0.0
        utilizations = [d.get("utilization", 0) for _, _, d in self.G.edges(data=True)]
        return min(sum(utilizations) / len(utilizations) * 100, 100)

    def get_road_utilizations(self) -> Dict[str, float]:
        result = {}
        for u, v, d in self.G.edges(data=True):
            rid = d.get("road_id", "")
            if not rid.endswith("_r"):
                result[rid] = d.get("utilization", 0)
        return result

    def redistribute_traffic(self, closed_road_id: str, roads: List[Road]) -> Dict[str, float]:
        closed = next((r for r in roads if r.id == closed_road_id), None)
        if not closed:
            return {}
        diverted_volume = closed.traffic_volume
        paths = self.get_alternate_paths(closed.source_node, closed.dest_node)
        increases = {}
        if not paths:
            return increases
        per_path = diverted_volume / len(paths)
        for path in paths:
            for i in range(len(path) - 1):
                edge_data = self.G.get_edge_data(path[i], path[i+1])
                if edge_data:
                    rid = edge_data.get("road_id", "")
                    if not rid.endswith("_r"):
                        cap = edge_data.get("capacity", 1000)
                        increases[rid] = increases.get(rid, 0) + (per_path / cap * 100)
        return increases
