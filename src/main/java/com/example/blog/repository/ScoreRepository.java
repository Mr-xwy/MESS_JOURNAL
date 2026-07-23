package com.example.blog.repository;

import com.example.blog.entity.Score;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    /** 某用户在某日某词方上的成绩（每人每天每词方仅一条最好成绩） */
    Optional<Score> findByUserIdAndDateAndPuzzleKey(Long userId, String date, String puzzleKey);

    /** 某日某词方榜单：按用时升序 */
    List<Score> findByDateAndPuzzleKeyOrderBySecondsAsc(String date, String puzzleKey);

    /** 成绩严格优于指定秒数的人数（用于计算排名） */
    @Query(
            "select count(s) from Score s where s.date = :date and s.puzzleKey = :key and s.seconds <"
                    + " :mySeconds")
    int countBetter(
            @Param("date") String date,
            @Param("key") String puzzleKey,
            @Param("mySeconds") int mySeconds);
}
