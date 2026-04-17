import unittest
import xml.etree.ElementTree as ET
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.compiler.musicxml import MusicXMLEmitter, MeasureIR, NoteEvent

class TestMusicXMLEmitter(unittest.TestCase):
    def test_xml_generation_with_polyphony(self):
        m1 = MeasureIR(1)
        m1.voices[1] = [NoteEvent('C', 4, 4), NoteEvent('D', 4, 4)]
        m1.voices[2] = [NoteEvent('E', 3, 8)]

        m2 = MeasureIR(2)
        m2.voices[1] = [NoteEvent('E', 4, 8)]

        emitter = MusicXMLEmitter()
        xml_string = emitter.emit([m1, m2])

        # Parse and verify DOM trees dynamically generated (no hardcoded string mock)
        root = ET.fromstring(xml_string.split('\\n', 1)[-1] if '<?xml' in xml_string else xml_string)
        
        self.assertEqual(root.tag, 'score-partwise')
        self.assertEqual(root.attrib['version'], '4.0')

        measures = root.findall('.//measure')
        self.assertEqual(len(measures), 2)
        
        m1_notes = measures[0].findall('note')
        self.assertEqual(len(m1_notes), 3)
        self.assertEqual(m1_notes[0].find('pitch/step').text, 'C')
        self.assertEqual(m1_notes[1].find('pitch/step').text, 'D')
        self.assertEqual(m1_notes[2].find('pitch/step').text, 'E')
        
        # Verify temporal alignment tags injected properly
        backups = measures[0].findall('backup')
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].find('duration').text, '8')
        
        m2_notes = measures[1].findall('note')
        self.assertEqual(len(m2_notes), 1)

if __name__ == '__main__':
    unittest.main()
