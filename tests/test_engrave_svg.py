import os
import sys
import unittest
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.compiler.engrave_svg import BoundingBox, Skyline, SVGEngraver

class TestSVGEngraver(unittest.TestCase):
    def test_bounding_box_intersection(self):
        b1 = BoundingBox(0, 0, 10, 10)
        b2 = BoundingBox(5, 5, 10, 10)
        b3 = BoundingBox(20, 20, 10, 10)
        
        self.assertTrue(b1.intersects(b2))
        self.assertFalse(b1.intersects(b3))

    def test_skyline_routing(self):
        skyline = Skyline()
        skyline.insert(BoundingBox(10, 40, 20, 20))
        
        # Slur from x=0 to x=40, height=5. Obstacle at x=10..30, y=40..60.
        # if slur min_y is 50, it collides. Must push y up.
        box = skyline.route_slur(0, 50, 40, 50, height=5)
        self.assertLessEqual(box.y, 40 - 5)

    def test_svg_generation_smufl_unicode(self):
        engraver = SVGEngraver()
        notes = [{'y': 100, 'dynamic': 'f'}, {'y': 90, 'slur': True, 'add_blockade': True}, {'y': 100}]
        
        svg_str = engraver.engrave(notes)
        
        root = ET.fromstring(svg_str.split('\\n', 1)[-1] if '<?xml' in svg_str else svg_str)
        
        self.assertEqual(root.tag, '{http://www.w3.org/2000/svg}svg')
        texts = root.findall('.//{http://www.w3.org/2000/svg}text')
        
        self.assertTrue(len(texts) > 0)
        
        # Find gClef
        clefs = [t for t in texts if t.text == '\uE050']
        self.assertEqual(len(clefs), 1)
        
        # Find path
        paths = root.findall('.//{http://www.w3.org/2000/svg}path')
        self.assertEqual(len(paths), 1)
        self.assertIn("Q", paths[0].attrib["d"])

if __name__ == '__main__':
    unittest.main()
