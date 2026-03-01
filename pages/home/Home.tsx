import styles from './Home.module.css';
import OlympiadSection from './OlympiadSection';
import ProgressSection from './ProgressSection';
import HomeCoursesPreview from './HomeCoursesPreview';
import HomePostsPreview from './HomePostsPreview';
import HomeTestsPreview from './HomeTestsPreview';

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <OlympiadSection />
      <ProgressSection />
      <HomeTestsPreview />
      <HomeCoursesPreview />
      <HomePostsPreview />
    </div>
  );
}