# implementing Trie dsa for auto suggestion for category selection of the learner, there are alternatives, but used for learning purpose

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class CategoryTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word.lower().strip():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def starts_with(self, prefix):
        node = self.root
        for char in prefix.lower().strip():
            if char not in node.children:
                return []
            node = node.children[char]

        return self._collect_from(node, prefix.lower().strip())

    def _collect_from(self, node, prefix):
        results = []

        def dfs(curr, path):
            if curr.is_end:
                results.append(prefix + path)
            for char, next_node in curr.children.items():
                dfs(next_node, path + char)

        dfs(node, "")
        return results
